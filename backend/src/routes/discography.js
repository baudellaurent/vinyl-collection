const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const discogs = require('../services/discogs');
const { query } = require('../db');

router.use(auth);

/**
 * GET /api/discography/:artistName?page=&sortOrder=
 * Returns paginated master releases for an artist, sorted by popularity/date/relevance.
 */
router.get('/:artistName', async (req, res, next) => {
  try {
    const { artistName } = req.params;
    const { page, sortOrder } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const sort = sortOrder || 'weighted';

    if (!artistName || artistName.trim().length < 1) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    // Get paginated masters directly from Discogs search
    const { releases, total, hasMore } = await discogs.getArtistMasters(
      artistName,
      pageNum,
      sort
    );

    if (releases.length === 0) {
      return res.json({ artist: artistName, releases: [], total: 0, page: pageNum, hasMore: false });
    }

    // Cross-reference with user's collection by discogs_id OR master_id
    // In test mode, collection is empty
    let collectionDiscogsIds = new Set();
    let collectionMasterIds = new Set();

    if (req.authMode !== 'test') {
      const userCollection = await query(
        'SELECT discogs_id, master_id FROM vinyls WHERE discogs_id IS NOT NULL OR master_id IS NOT NULL'
      );
      collectionDiscogsIds = new Set(userCollection.rows.map((r) => r.discogs_id).filter(Boolean));
      collectionMasterIds = new Set(userCollection.rows.map((r) => r.master_id).filter(Boolean));
    }

    const ranked = releases.map((release, index) => ({
      rank: (pageNum - 1) * 8 + index + 1,
      id: release.id,
      title: release.title,
      artist: release.artist || artistName,
      year: release.year,
      cover_url: release.cover_url,
      rating: release.rating,
      rating_count: release.rating_count,
      want: release.want,
      inCollection: collectionDiscogsIds.has(release.id) || collectionMasterIds.has(release.id),
    }));

    res.json({
      artist: artistName,
      total,
      page: pageNum,
      hasMore,
      releases: ranked,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
