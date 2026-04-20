const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');
const { query } = require('../db');

router.use(auth);

const TOKEN = process.env.DISCOGS_TOKEN;

/**
 * POST /api/maintenance/sync-master-ids
 * Fetches master_id for all vinyls that don't have one yet.
 */
router.post('/sync-master-ids', async (req, res, next) => {
  try {
    // Get all vinyls without master_id that have a discogs_id
    // Use ?force=true to re-sync all (including those with master_id = discogs_id)
    const force = req.query.force === 'true';
    const result = await query(
      force
        ? 'SELECT id, discogs_id, title FROM vinyls WHERE discogs_id IS NOT NULL'
        : 'SELECT id, discogs_id, title FROM vinyls WHERE master_id IS NULL AND discogs_id IS NOT NULL'
    );

    const vinyls = result.rows;
    if (vinyls.length === 0) {
      return res.json({ message: 'All vinyls already have master_id', updated: 0 });
    }

    let updated = 0;
    let failed = 0;
    const details = [];

    for (const vinyl of vinyls) {
      try {
        // Wait 1.1s between calls to respect Discogs rate limit
        await new Promise((r) => setTimeout(r, 1100));

        const response = await axios.get(
          `https://api.discogs.com/releases/${vinyl.discogs_id}`,
          {
            params: { token: TOKEN },
            headers: { 'User-Agent': 'VinylCollection/1.0' },
            timeout: 8000,
          }
        );

        const masterId = response.data.master_id;
        if (masterId) {
          await query(
            'UPDATE vinyls SET master_id = $1 WHERE id = $2',
            [String(masterId), vinyl.id]
          );
          updated++;
          details.push({ id: vinyl.id, title: vinyl.title, master_id: String(masterId) });
        } else {
          // No master_id — search by title+artist to find the master
          await new Promise((r) => setTimeout(r, 1100));
          const releaseData = response.data;
          const artistName = Array.isArray(releaseData.artists)
            ? releaseData.artists[0]?.name || ''
            : '';
          const titleName = releaseData.title || '';

          try {
            const searchResp = await axios.get('https://api.discogs.com/database/search', {
              params: {
                artist: artistName,
                release_title: titleName,
                type: 'master',
                per_page: 1,
                token: process.env.DISCOGS_TOKEN,
              },
              headers: { 'User-Agent': 'VinylCollection/1.0' },
              timeout: 8000,
            });
            const masterResult = searchResp.data.results?.[0];
            if (masterResult?.id) {
              await query('UPDATE vinyls SET master_id = $1 WHERE id = $2', [String(masterResult.id), vinyl.id]);
              details.push({ id: vinyl.id, title: vinyl.title, master_id: String(masterResult.id), note: 'found via search' });
            } else {
              // Last resort: use discogs_id
              await query('UPDATE vinyls SET master_id = $1 WHERE id = $2', [vinyl.discogs_id, vinyl.id]);
              details.push({ id: vinyl.id, title: vinyl.title, master_id: vinyl.discogs_id, note: 'no master found, used discogs_id' });
            }
          } catch {
            await query('UPDATE vinyls SET master_id = $1 WHERE id = $2', [vinyl.discogs_id, vinyl.id]);
            details.push({ id: vinyl.id, title: vinyl.title, master_id: vinyl.discogs_id, note: 'search failed, used discogs_id' });
          }
          updated++;
        }
      } catch (err) {
        failed++;
        details.push({ id: vinyl.id, title: vinyl.title, error: err.message });
      }
    }

    res.json({ message: 'Sync complete', total: vinyls.length, updated, failed, details });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
