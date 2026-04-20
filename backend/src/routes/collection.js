const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');
const { query } = require('../db');
const testStore = require('../services/testStore');

router.use(auth);

/**
 * Fetch master_id from Discogs for a given release ID (async, non-blocking).
 */
async function fetchAndSaveMasterId(vinylId, discogsId) {
  try {
    await new Promise((r) => setTimeout(r, 500));
    const response = await axios.get(
      `https://api.discogs.com/releases/${discogsId}`,
      {
        params: { token: process.env.DISCOGS_TOKEN },
        headers: { 'User-Agent': 'VinylCollection/1.0' },
        timeout: 8000,
      }
    );
    const masterId = response.data.master_id;
    if (masterId) {
      await query('UPDATE vinyls SET master_id = $1 WHERE id = $2', [String(masterId), vinylId]);
    } else {
      // No master (single/EP) — use discogs_id as master_id
      await query('UPDATE vinyls SET master_id = $1 WHERE id = $2', [discogsId, vinylId]);
    }
  } catch (err) {
    console.error(`Failed to fetch master_id for vinyl ${vinylId}:`, err.message);
  }
}

/**
 * GET /api/collection
 * In test mode: returns in-memory session collection.
 */
router.get('/', async (req, res, next) => {
  if (req.authMode === 'test') {
    const { search } = req.query;
    const vinyls = testStore.getVinyls(req.authToken, search);
    return res.json({ vinyls, total: vinyls.length, testMode: true });
  }
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
 * In test mode: stores in memory only.
 */
router.post('/', async (req, res, next) => {
  if (req.authMode === 'test') {
    const { barcode, discogs_id, master_id, title, artist, year, genre, cover_url, discogs_rating, discogs_rating_count } = req.body;
    if (!title || !artist) return res.status(400).json({ error: 'title and artist are required' });
    const result = testStore.addVinyl(req.authToken, { barcode, discogs_id, master_id, title, artist, year, genre, cover_url, discogs_rating, discogs_rating_count });
    if (result.error) return res.status(result.code).json({ error: result.error });
    return res.status(201).json({ vinyl: result.vinyl, testMode: true });
  }
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

    // If no master_id provided, fetch it asynchronously from Discogs
    if (!master_id && discogs_id) {
      const newId = result.rows[0].id;
      fetchAndSaveMasterId(newId, discogs_id); // fire and forget
    }
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
 * In test mode: removes from memory.
 */
router.delete('/discogs/:discogsId', async (req, res, next) => {
  if (req.authMode === 'test') {
    const removed = testStore.removeVinylByDiscogsId(req.authToken, req.params.discogsId);
    return res.json({ deleted: removed, discogs_id: req.params.discogsId, testMode: true });
  }
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
 * In test mode: removes from memory.
 */
router.delete('/:id', async (req, res, next) => {
  if (req.authMode === 'test') {
    const removed = testStore.removeVinyl(req.authToken, Number(req.params.id));
    return res.json({ deleted: removed, id: Number(req.params.id), testMode: true });
  }
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
