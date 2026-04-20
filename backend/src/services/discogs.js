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
 * Check if a title contains non-Latin characters (Japanese, Korean, Hebrew, etc.)
 */
function hasNonLatinChars(str) {
  if (!str) return false;
  return /[\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/.test(str);
}

/**
 * Search Discogs by artist and album name.
 * @param {string} artist
 * @param {string} album
 * @param {string} country - e.g. 'US', 'UK', 'France' (empty = all)
 * @param {number} page - page number (1-based)
 * @returns {Promise<Array>} Up to 8 normalized release objects
 */
async function searchByArtistAlbum(artist, album, country = '', page = 1) {
  const baseParams = {
    artist,
    release_title: album,
    format: 'Vinyl',
    per_page: 25,
    page,
    token: TOKEN,
  };

  if (country) {
    baseParams.country = country;
  }

  // Search releases with country filter
  const releaseResponse = await client.get('/database/search', {
    params: { ...baseParams, type: 'release' },
  });
  const releases = (releaseResponse.data.results || [])
    .filter((r) => !hasNonLatinChars(r.title));

  // If no country filter, also search masters (page 1 only)
  let masters = [];
  if (!country && page === 1) {
    const masterResponse = await client.get('/database/search', {
      params: { ...baseParams, type: 'master' },
    });
    masters = (masterResponse.data.results || [])
      .filter((r) => !hasNonLatinChars(r.title));
  }

  // Merge, deduplicate by normalized title+year, limit to 8
  const combined = [...masters, ...releases];
  const seen = new Set();
  const deduped = combined.filter((r) => {
    const normalizedTitle = (r.title || '')
      .replace(/^[^-]+ - /i, '')
      .toLowerCase()
      .trim();
    const key = `${normalizedTitle}|${r.year || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.slice(0, 8).map((item) => ({
    ...normalizeRelease(item),
    country: item.country || null,
  }));
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

/**
 * Search for an artist by name and return their Discogs artist ID.
 * @param {string} artistName
 * @returns {Promise<string|null>} Discogs artist ID
 */
async function searchArtistId(artistName) {
  const response = await client.get('/database/search', {
    params: {
      q: artistName,
      type: 'artist',
      per_page: 5,
      token: TOKEN,
    },
  });
  const results = response.data.results || [];
  if (results.length === 0) return null;
  // Return the first result's ID
  return String(results[0].id);
}

module.exports = {
  searchByBarcode,
  searchByArtistAlbum,
  searchArtistId,
  getRelease,
  getArtistReleases,
};
