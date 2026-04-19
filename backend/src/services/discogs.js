const axios = require('axios');

const BASE_URL = 'https://api.discogs.com';
const TOKEN = process.env.DISCOGS_TOKEN;

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'User-Agent': 'VinylCollection/1.0',
    'Authorization': `Discogs token=${TOKEN}`,
  },
  timeout: 10000,
});

/**
 * Normalize a Discogs release/search result into a consistent shape.
 */
function normalizeRelease(item) {
  return {
    id: String(item.id || ''),
    title: item.title || '',
    artist: Array.isArray(item.artists)
      ? item.artists.map((a) => a.name).join(', ')
      : (item.artist || extractArtistFromTitle(item.title) || ''),
    year: item.year || null,
    genre: Array.isArray(item.genres)
      ? item.genres[0]
      : (Array.isArray(item.genre) ? item.genre[0] : null),
    cover_url: item.cover_image || item.thumb || null,
    rating: item.community?.rating?.average || null,
    rating_count: item.community?.rating?.count || null,
    discogs_artist_id: Array.isArray(item.artists) && item.artists[0]
      ? String(item.artists[0].id)
      : null,
    formats: Array.isArray(item.formats)
      ? item.formats.map((f) => f.name).join(', ')
      : null,
  };
}

/**
 * Some search results encode "Artist - Title" in the title field.
 */
function extractArtistFromTitle(title) {
  if (!title) return '';
  const parts = title.split(' - ');
  return parts.length > 1 ? parts[0].trim() : '';
}

/**
 * Search Discogs by barcode.
 * @param {string} barcode
 * @returns {Promise<Array>} Normalized release objects
 */
async function searchByBarcode(barcode) {
  const response = await client.get('/database/search', {
    params: { barcode, token: TOKEN },
  });
  const results = response.data.results || [];
  return results.map(normalizeRelease);
}

/**
 * Search Discogs by artist and album name.
 * @param {string} artist
 * @param {string} album
 * @returns {Promise<Array>} Top 5 normalized release objects
 */
async function searchByArtistAlbum(artist, album) {
  const response = await client.get('/database/search', {
    params: {
      artist,
      release_title: album,
      type: 'release',
      token: TOKEN,
    },
  });
  const results = response.data.results || [];
  return results.slice(0, 5).map(normalizeRelease);
}

/**
 * Get full release details by Discogs release ID.
 * @param {string|number} releaseId
 * @returns {Promise<Object>} Normalized release object
 */
async function getRelease(releaseId) {
  const response = await client.get(`/releases/${releaseId}`, {
    params: { token: TOKEN },
  });
  return normalizeRelease(response.data);
}

/**
 * Get all releases for a Discogs artist ID, sorted by year ascending.
 * @param {string|number} artistId
 * @returns {Promise<Array>} Normalized release objects
 */
async function getArtistReleases(artistId) {
  const response = await client.get(`/artists/${artistId}/releases`, {
    params: {
      sort: 'year',
      sort_order: 'asc',
      per_page: 100,
      token: TOKEN,
    },
  });
  const releases = response.data.releases || [];
  // Filter to main releases only (type: 'master' or 'release')
  return releases
    .filter((r) => r.role === 'Main')
    .map((r) => ({
      id: String(r.id || r.main_release || ''),
      title: r.title || '',
      artist: r.artist || '',
      year: r.year || null,
      cover_url: r.thumb || null,
      rating: r.stats?.community?.rating?.average || null,
      rating_count: r.stats?.community?.rating?.count || null,
      type: r.type || 'release',
      discogs_artist_id: String(artistId),
    }));
}

module.exports = {
  searchByBarcode,
  searchByArtistAlbum,
  getRelease,
  getArtistReleases,
};
