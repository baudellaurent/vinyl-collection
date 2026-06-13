const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { query } = require('../db');
const { getRecommendations } = require('../services/recommendations');

router.use(auth);

// Simple server-side cache to avoid hammering Discogs API
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

router.get('/', async (req, res, next) => {
  // Test mode: collection is too small to be meaningful
  if (req.authMode === 'test') {
    return res.json({
      profile: null,
      byArtist: [],
      byGenre: [],
      byDiscovery: [],
      testMode: true,
    });
  }

  if (cache && Date.now() - cacheTime < CACHE_TTL) {
    return res.json(cache);
  }

  try {
    const result = await query('SELECT * FROM vinyls ORDER BY added_at DESC');
    const recommendations = await getRecommendations(result.rows);

    cache = recommendations;
    cacheTime = Date.now();

    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

// Invalidate cache (called after adding/removing a vinyl)
router.delete('/cache', (req, res) => {
  cache = null;
  cacheTime = 0;
  res.json({ ok: true });
});

module.exports = router;
