const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const discogs = require('../services/discogs');
const { query } = require('../db');

router.use(auth);

/**
 * Compute a weighted score: average_rating * log(1 + rating_count)
 * This balances quality with popularity.
 */
function weightedScore(rating, ratingCount) {
  if (!rating || !ratingCount) return 0;
  return rating * Math.log(1 + ratingCount);
}

/**
 * GET /api/discography/:artistName
 * Get all albums by artist from Discogs, ranked by weighted rating score.
 * Cross-references with user's collection to mark inCollection.
 */
router.get('/:artistName', async (req, res, next) => {
  try {
    const { artistName } = req.params;

    if (!artistName || artistName.trim().length < 1) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    // Step 1: Search for the artist on Discogs to get their ID
    const artistId = await discogs.searchArtistId(artistName);
    if (!artistId) {
      return res.json({ artist: artistName, releases: [] });
    }

    // Step 2: Get all releases for this artist
    let releases = [];
    try {
      releases = await discogs.getArtistReleases(artistId);
    } catch (err) {
      console.error('Error fetching artist releases:', err.message);
      // Fall back to search results if artist releases endpoint fails
      releases = searchResults;
    }

    if (releases.length === 0) {
      return res.json({ artist: artistName, releases: [] });
    }

    // Step 3: Get user's collection to cross-reference
    const userCollection = await query(
      'SELECT discogs_id, title, artist FROM vinyls WHERE discogs_id IS NOT NULL'
    );
    const collectionIds = new Set(userCollection.rows.map((r) => r.discogs_id));

    // Step 4: Compute weighted scores and rank
    const ranked = releases
      .map((release) => ({
        ...release,
        score: weightedScore(release.rating, release.rating_count),
        inCollection: collectionIds.has(release.id),
      }))
      .sort((a, b) => b.score - a.score)
      .map((release, index) => ({
        rank: index + 1,
        id: release.id,
        title: release.title,
        artist: release.artist || artistName,
        year: release.year,
        cover_url: release.cover_url,
        rating: release.rating,
        rating_count: release.rating_count,
        score: Math.round(release.score * 100) / 100,
        inCollection: release.inCollection,
      }));

    res.json({
      artist: artistName,
      artistId,
      total: ranked.length,
      releases: ranked,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
