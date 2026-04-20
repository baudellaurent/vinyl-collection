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
    const result = await query(
      'SELECT id, discogs_id, title FROM vinyls WHERE master_id IS NULL AND discogs_id IS NOT NULL'
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
          // No master_id (single/EP) — set to discogs_id itself so it matches
          await query(
            'UPDATE vinyls SET master_id = $1 WHERE id = $2',
            [vinyl.discogs_id, vinyl.id]
          );
          details.push({ id: vinyl.id, title: vinyl.title, master_id: vinyl.discogs_id, note: 'no master, used discogs_id' });
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
