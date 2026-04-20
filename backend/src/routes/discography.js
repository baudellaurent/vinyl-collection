const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const discogs = require('../services/discogs');
const { query } = require('../db');

router.use(auth);

const PAGE_SIZE = 8;

function weightedScore(rating, ratingCount) {
  if (!rating || !ratingCount) return 0;
  return rating * Math.log(1 + ratingCount);
}

/**
 * GET /api/discography/:artistName?page=&sortOrder=
 */
router.get('/:artistName', async (req, res, next) => {
  try {
    const { artistName } = req.params;
    const { page, sortOrder } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);

    if (!artistName || artistName.trim().length < 1) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    // Step 1: Find artist ID
    const artistId = await discogs.searchArtistId(artistName);
    if (!artistId) {
      return res.json({ artist: artistName, releases: [], total: 0, page: 1, hasMore: false });
    }

    // Step 2: Get all releases
    let releases = [];
    try {
      releases = await discogs.getArtistReleases(artistId);
    } catch (err) {
      console.error('Error fetching artist releases:', err.message);
      return res.json({ artist: artistName, releases: [], total: 0, page: 1, hasMore: false });
    }

    if (releases.length === 0) {
      return res.json({ artist: artistName, releases: [], total: 0, page: 1, hasMore: false });
    }

    // Step 3: Get user's collection
    const userCollection = await query(
      'SELECT discogs_id FROM vinyls WHERE discogs_id IS NOT NULL'
    );
    const collectionIds = new Set(userCollection.rows.map((r) => r.discogs_id));

    // Step 4: Sort
    let sorted;
    if (sortOrder === 'date') {
      sorted = releases.sort((a, b) => (a.year || 9999) - (b.year || 9999));
    } else if (sortOrder === 'relevance') {
      sorted = releases; // keep original order
    } else {
      // Default: weighted score
      sorted = releases
        .map((r) => ({ ...r, score: weightedScore(r.rating, r.rating_count) }))
        .sort((a, b) => b.score - a.score);
    }

    // Step 5: Paginate
    const total = sorted.length;
    const start = (pageNum - 1) * PAGE_SIZE;
    const paginated = sorted.slice(start, start + PAGE_SIZE);
    const hasMore = start + PAGE_SIZE < total;

    const ranked = paginated.map((release, index) => ({
      rank: start + index + 1,
      id: release.id,
      title: release.title,
      artist: release.artist || artistName,
      year: release.year,
      cover_url: release.cover_url,
      rating: release.rating,
      rating_count: release.rating_count,
      score: release.score ? Math.round(release.score * 100) / 100 : null,
      inCollection: collectionIds.has(release.id),
    }));

    res.json({
      artist: artistName,
      artistId,
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
