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
 * Get all master releases for an artist, using search API with sort options.
 * @param {string} artistName
 * @param {number} page
 * @param {string} sortOrder - 'weighted'|'date'|'relevance'
 * @returns {Promise<{releases: Array, total: number, hasMore: boolean}>}
 */
async function getArtistMasters(artistName, page = 1, sortOrder = 'weighted') {
  const PAGE_SIZE = 8;

  // Map sortOrder to Discogs sort param
  let discogsSort = 'want'; // default: most wanted = popularity proxy
  let discogsSortOrder = 'desc';
  if (sortOrder === 'date') {
    discogsSort = 'year';
    discogsSortOrder = 'asc';
  } else if (sortOrder === 'relevance') {
    discogsSort = undefined;
    discogsSortOrder = undefined;
  }

  const params = {
    artist: artistName,
    type: 'master',
    per_page: PAGE_SIZE,
    page,
    token: TOKEN,
  };
  if (discogsSort) {
    params.sort = discogsSort;
    params.sort_order = discogsSortOrder;
  }

  const response = await client.get('/database/search', { params });
  const data = response.data;
  const results = (data.results || []).filter((r) => !hasNonLatinChars(r.title));
  const total = data.pagination?.items || results.length;
  const hasMore = page < (data.pagination?.pages || 1);

  const releases = results.map((item) => ({
    id: String(item.id || ''),
    title: item.title || '',
    artist: artistName,
    year: item.year || null,
    cover_url: item.cover_image || item.thumb || null,
    rating: item.community?.rating?.average || null,
    rating_count: item.community?.rating?.count || null,
    want: item.community?.want || null,
    have: item.community?.have || null,
    genre: Array.isArray(item.genre) ? item.genre[0] : null,
  }));

  return { releases, total, hasMore };
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
  getArtistMasters,
};
