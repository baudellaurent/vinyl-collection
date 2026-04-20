const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const discogs = require('../services/discogs');
const { query } = require('../db');

router.use(auth);

/**
 * GET /api/search/barcode/:barcode
 */
router.get('/barcode/:barcode', async (req, res, next) => {
  try {
    const { barcode } = req.params;

    if (!barcode || !/^[\w-]{4,50}$/.test(barcode)) {
      return res.status(400).json({ error: 'Invalid barcode format' });
    }

    const collectionCheck = await query(
      'SELECT * FROM vinyls WHERE barcode = $1 LIMIT 1',
      [barcode]
    );
    const inCollection = collectionCheck.rows.length > 0;
    const existingVinyl = inCollection ? collectionCheck.rows[0] : null;

    let album = null;
    let found = false;

    try {
      const results = await discogs.searchByBarcode(barcode);
      if (results.length > 0) {
        found = true;
        album = results[0];

        if (!inCollection && album.id) {
          const discogsCheck = await query(
            'SELECT * FROM vinyls WHERE discogs_id = $1 LIMIT 1',
            [album.id]
          );
          if (discogsCheck.rows.length > 0) {
            return res.json({
              found: true,
              inCollection: true,
              album,
              collectionEntry: discogsCheck.rows[0],
            });
          }
        }
      }
    } catch (apiErr) {
      console.error('Discogs barcode search error:', apiErr.message);
    }

    res.json({ found, inCollection, album, collectionEntry: existingVinyl });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/search/query?artist=&album=&country=&page=&sortOrder=
 */
router.get('/query', async (req, res, next) => {
  try {
    const { artist, album, country, page, sortOrder } = req.query;

    if (!artist && !album) {
      return res.status(400).json({ error: 'Provide at least artist or album query parameter' });
    }

    const pageNum = Math.max(1, parseInt(page) || 1);

    let results = await discogs.searchByArtistAlbum(
      artist || '',
      album || '',
      country || '',
      pageNum
    );

    // Apply sort order
    if (sortOrder === 'date') {
      results = results.sort((a, b) => (a.year || 9999) - (b.year || 9999));
    } else if (sortOrder === 'weighted') {
      results = results.sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.log(1 + (a.rating_count || 0));
        const scoreB = (b.rating || 0) * Math.log(1 + (b.rating_count || 0));
        return scoreB - scoreA;
      });
    }
    // 'relevance' = keep Discogs order

    if (results.length === 0) {
      return res.json({ results: [], page: pageNum, hasMore: false });
    }

    const discogsIds = results.map((r) => r.id).filter(Boolean);
    let inCollectionIds = new Set();

    if (req.authMode === 'test') {
      inCollectionIds = require('../services/testStore').getDiscogsIds(req.authToken);
    } else if (discogsIds.length > 0) {
      const placeholders = discogsIds.map((_, i) => '$' + (i + 1)).join(', ');
      const dbResult = await query(
        'SELECT discogs_id FROM vinyls WHERE discogs_id IN (' + placeholders + ')',
        discogsIds
      );
      inCollectionIds = new Set(dbResult.rows.map((r) => r.discogs_id));
    }

    const enriched = results.map((r) => ({
      ...r,
      inCollection: inCollectionIds.has(r.id),
    }));

    res.json({ results: enriched, page: pageNum, hasMore: results.length === 8 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
