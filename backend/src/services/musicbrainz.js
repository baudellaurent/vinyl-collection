const axios = require('axios');

const BASE_URL = 'https://musicbrainz.org/ws/2';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'User-Agent': 'VinylCollection/1.0 (contact@example.com)',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// MusicBrainz rate limit: max 1 request/second
const RATE_LIMIT_MS = 1100;
let lastRequestTime = 0;

async function rateLimitedRequest(config) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
  return client.request(config);
}

/**
 * Search MusicBrainz for a release by artist and album name.
 * @param {string} artist
 * @param {string} album
 * @returns {Promise<Array>} Array of release objects
 */
async function searchRelease(artist, album) {
  const query = `artist:${encodeURIComponent(artist)}+release:${encodeURIComponent(album)}`;
  const response = await rateLimitedRequest({
    method: 'GET',
    url: '/release/',
    params: { query, fmt: 'json', limit: 5 },
  });

  const releases = response.data.releases || [];
  return releases.map((r) => ({
    mbid: r.id,
    title: r.title || '',
    artist: r['artist-credit']?.[0]?.artist?.name || '',
    year: r.date ? parseInt(r.date.substring(0, 4), 10) : null,
    status: r.status || null,
    country: r.country || null,
  }));
}

/**
 * Get all album release groups for a MusicBrainz artist MBID.
 * @param {string} artistMbid
 * @returns {Promise<Array>} Array of release group objects
 */
async function getArtistReleaseGroups(artistMbid) {
  const response = await rateLimitedRequest({
    method: 'GET',
    url: '/release-group',
    params: {
      artist: artistMbid,
      type: 'album',
      fmt: 'json',
      limit: 100,
    },
  });

  const groups = response.data['release-groups'] || [];
  return groups.map((rg) => ({
    mbid: rg.id,
    title: rg.title || '',
    year: rg['first-release-date']
      ? parseInt(rg['first-release-date'].substring(0, 4), 10)
      : null,
    type: rg['primary-type'] || 'Album',
  }));
}

module.exports = {
  searchRelease,
  getArtistReleaseGroups,
};
