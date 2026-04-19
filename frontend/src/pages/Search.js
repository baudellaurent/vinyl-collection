import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchQuery, addToCollection } from '../services/api';

function SearchResultItem({ result, onAdd, isAdding }) {
  const navigate = useNavigate();

  return (
    <div className="search-result-item">
      {result.cover_url ? (
        <img
          className="search-result-cover"
          src={result.cover_url}
          alt={`${result.title} cover`}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="search-result-cover flex-center" aria-hidden="true" style={{ background: 'var(--bg-secondary)', borderRadius: 6 }}>
          🎵
        </div>
      )}

      <div className="search-result-info">
        <div
          className="search-result-title"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/album/${result.id}`, { state: { album: result } })}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate(`/album/${result.id}`, { state: { album: result } })}
        >
          {result.title}
        </div>
        <div className="search-result-artist">{result.artist}</div>
        <div className="search-result-meta">
          {result.year && <span>{result.year}</span>}
          {result.genre && <span> · {result.genre}</span>}
          {result.rating && <span> · ★ {result.rating.toFixed(2)}</span>}
        </div>
      </div>

      {result.inCollection ? (
        <span className="in-collection-badge" style={{ position: 'static', flexShrink: 0 }}>✓</span>
      ) : (
        <button
          className="btn btn-primary"
          onClick={() => onAdd(result)}
          disabled={isAdding === result.id}
          aria-label={`Ajouter ${result.title} à la collection`}
          style={{ flexShrink: 0, padding: '8px 14px', fontSize: '0.8rem' }}
        >
          {isAdding === result.id ? '...' : '+ Ajouter'}
        </button>
      )}
    </div>
  );
}

function Search() {
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAdding, setIsAdding] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!artist.trim() && !album.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await searchQuery(artist.trim(), album.trim());
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (result) => {
    setIsAdding(result.id);
    setError(null);
    try {
      await addToCollection({
        discogs_id: result.id,
        title: result.title,
        artist: result.artist,
        year: result.year,
        genre: result.genre,
        cover_url: result.cover_url,
        discogs_rating: result.rating,
        discogs_rating_count: result.rating_count,
      });
      setAddedIds((prev) => new Set([...prev, result.id]));
      setResults((prev) =>
        prev.map((r) => (r.id === result.id ? { ...r, inCollection: true } : r))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">🔍 Recherche</h1>
        <p className="page-subtitle">Recherchez un album par artiste et/ou titre</p>
      </header>

      <form onSubmit={handleSearch} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="artist-input">Artiste</label>
          <input
            id="artist-input"
            type="text"
            className="form-input"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="ex: Pink Floyd"
            autoComplete="off"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="album-input">Album</label>
          <input
            id="album-input"
            type="text"
            className="form-input"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="ex: The Dark Side of the Moon"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={isLoading || (!artist.trim() && !album.trim())}
        >
          {isLoading ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {error && (
        <div className="error-message mt-16" role="alert">{error}</div>
      )}

      {isLoading && (
        <div className="loading mt-16" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <span>Recherche sur Discogs...</span>
        </div>
      )}

      {!isLoading && hasSearched && (
        <div className="mt-16">
          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">🔍</div>
              <h3>Aucun résultat</h3>
              <p>Essayez avec des termes différents.</p>
            </div>
          ) : (
            <>
              <p className="text-muted mb-16" style={{ fontSize: '0.85rem' }}>
                {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              </p>
              <div className="search-results">
                {results.map((result) => (
                  <SearchResultItem
                    key={result.id}
                    result={result}
                    onAdd={handleAdd}
                    isAdding={isAdding}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}

export default Search;
