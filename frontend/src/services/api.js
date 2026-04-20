import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Inject auth token from localStorage on every request
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('vinyl_auth');
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {}
  return config;
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

/** Fetch the full vinyl collection, optionally filtered by search term. */
export async function getCollection(search = '') {
  const params = search ? { search } : {};
  const { data } = await api.get('/collection', { params });
  return data;
}

/** Search Discogs by barcode and check if it's in the collection. */
export async function searchBarcode(barcode) {
  const { data } = await api.get(`/search/barcode/${encodeURIComponent(barcode)}`);
  return data;
}

/** Search Discogs by artist and/or album name. */
export async function searchQuery(artist = '', album = '', country = '', page = 1, sortOrder = 'relevance') {
  const { data } = await api.get('/search/query', {
    params: { artist, album, country, page, sortOrder },
  });
  return data;
}

/** Add a vinyl to the collection. */
export async function addToCollection(albumData) {
  const { data } = await api.post('/collection', albumData);
  return data;
}

/** Remove a vinyl from the collection by Discogs ID. */
export async function removeFromCollectionByDiscogsId(discogsId) {
  const { data } = await api.delete(`/collection/discogs/${encodeURIComponent(discogsId)}`);
  return data;
}

/** Remove a vinyl from the collection by ID. */
export async function removeFromCollection(id) {
  const { data } = await api.delete(`/collection/${id}`);
  return data;
}

/** Quick check if a barcode is already in the collection. */
export async function checkBarcode(barcode) {
  const { data } = await api.get(`/collection/check/${encodeURIComponent(barcode)}`);
  return data;
}

/** Get artist discography ranked by weighted rating. */
export async function getDiscography(artistName, page = 1, sortOrder = 'weighted') {
  const { data } = await api.get(`/discography/${encodeURIComponent(artistName)}`, {
    params: { page, sortOrder },
  });
  return data;
}

export default api;
