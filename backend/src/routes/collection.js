const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { query } = require('../db');

router.use(auth);

/**
 * GET /api/collection
 * List all vinyls sorted by artist then year.
 * Supports ?search= for filtering by title or artist.
 */
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;

    let sql;
    let params;

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      sql = `
        SELECT * FROM vinyls
        WHERE LOWER(artist) LIKE $1 OR LOWER(title) LIKE $1
        ORDER BY artist ASC, year ASC NULLS LAST
      `;
      params = [term];
    } else {
      sql = 'SELECT * FROM vinyls ORDER BY artist ASC, year ASC NULLS LAST';
      params = [];
    }

    const result = await query(sql, params);
    res.json({ vinyls: result.rows, total: result.rowCount });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/collection
 * Add a vinyl to the collection.
 * Body: { barcode?, discogs_id?, musicbrainz_id?, title, artist, year?, genre?, cover_url?, notes? }
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      barcode,
      discogs_id,
      master_id,
      musicbrainz_id,
      title,
      artist,
      year,
      genre,
      cover_url,
      discogs_rating,
      discogs_rating_count,
      notes,
    } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ error: 'title and artist are required' });
    }

    // Duplicate check
    if (barcode) {
      const existing = await query('SELECT id FROM vinyls WHERE barcode = $1', [barcode]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Vinyl with this barcode already in collection', id: existing.rows[0].id });
      }
    }
    if (discogs_id) {
      const existing = await query('SELECT id FROM vinyls WHERE discogs_id = $1', [discogs_id]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Vinyl with this Discogs ID already in collection', id: existing.rows[0].id });
      }
    }
    // Also check by master_id to prevent adding same album twice (release vs master)
    if (master_id) {
      const existing = await query('SELECT id FROM vinyls WHERE master_id = $1', [master_id]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Vinyl already in collection (same master)', id: existing.rows[0].id });
      }
    }

    const result = await query(
      `INSERT INTO vinyls
        (barcode, discogs_id, master_id, musicbrainz_id, title, artist, year, genre, cover_url, discogs_rating, discogs_rating_count, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        barcode || null,
        discogs_id || null,
        master_id || null,
        musicbrainz_id || null,
        title,
        artist,
        year || null,
        genre || null,
        cover_url || null,
        discogs_rating || null,
        discogs_rating_count || null,
        notes || null,
      ]
    );

    res.status(201).json({ vinyl: result.rows[0] });
  } catch (err) {
    // Handle unique constraint violations gracefully
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Vinyl already in collection' });
    }
    next(err);
  }
});

/**
 * DELETE /api/collection/discogs/:discogsId
 * Remove a vinyl from the collection by Discogs ID.
 */
router.delete('/discogs/:discogsId', async (req, res, next) => {
  try {
    const { discogsId } = req.params;
    const result = await query('DELETE FROM vinyls WHERE discogs_id = $1 RETURNING id', [discogsId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vinyl not found' });
    }
    res.json({ deleted: true, discogs_id: discogsId });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/collection/:id
 * Remove a vinyl from the collection.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const result = await query('DELETE FROM vinyls WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vinyl not found' });
    }

    res.json({ deleted: true, id: Number(id) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/collection/check/:barcode
 * Quick check: is this barcode already in the collection?
 */
router.get('/check/:barcode', async (req, res, next) => {
  try {
    const { barcode } = req.params;

    const result = await query(
      'SELECT * FROM vinyls WHERE barcode = $1 LIMIT 1',
      [barcode]
    );

    const inCollection = result.rows.length > 0;
    res.json({
      inCollection,
      vinyl: inCollection ? result.rows[0] : null,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
