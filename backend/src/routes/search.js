const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const discogs = require('../services/discogs');
const { query } = require('../db');

router.use(auth);

/**
 * GET /api/search/barcode/:barcode
 * Search Discogs by barcode, check if already in collection.
 */
router.get('/barcode/:barcode', async (req, res, next) => {
  try {
    const { barcode } = req.params;

    if (!barcode || !/^[\w-]{4,50}$/.test(barcode)) {
      return res.status(400).json({ error: 'Invalid barcode format' });
    }

    // Check collection first (fast path)
    const collectionCheck = await query(
      'SELECT * FROM vinyls WHERE barcode = $1 LIMIT 1',
      [barcode]
    );
    const inCollection = collectionCheck.rows.length > 0;
    const existingVinyl = inCollection ? collectionCheck.rows[0] : null;

    // Search Discogs
    let album = null;
    let found = false;

    try {
      const results = await discogs.searchByBarcode(barcode);
      if (results.length > 0) {
        found = true;
        album = results[0];
      }
    } catch (apiErr) {
      console.error('Discogs barcode search error:', apiErr.message);
      // Return collection result even if Discogs is down
    }

    res.json({
      found,
      inCollection,
      album,
      collectionEntry: existingVinyl,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/search/query?artist=&album=
 * Search Discogs by artist + album text, return top 5 with inCollection flags.
 */
router.get('/query', async (req, res, next) => {
  try {
    const { artist, album } = req.query;

    if (!artist && !album) {
      return res.status(400).json({ error: 'Provide at least artist or album query parameter' });
    }

    const results = await discogs.searchByArtistAlbum(
      artist || '',
      album || ''
    );

    if (results.length === 0) {
      return res.json({ results: [] });
    }

    // Batch check which results are already in collection
    const discogsIds = results.map((r) => r.id).filter(Boolean);
    let inCollectionIds = new Set();

    if (discogsIds.length > 0) {
      const placeholders = discogsIds.map((_, i) => `$${i + 1}`).join(', ');
      const dbResult = await query(
        `SELECT discogs_id FROM vinyls WHERE discogs_id IN (${placeholders})`,
        discogsIds
      );
      inCollectionIds = new Set(dbResult.rows.map((r) => r.discogs_id));
    }

    const enriched = results.map((r) => ({
      ...r,
      inCollection: inCollectionIds.has(r.id),
    }));

    res.json({ results: enriched });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
