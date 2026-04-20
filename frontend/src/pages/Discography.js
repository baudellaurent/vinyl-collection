import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DiscographyRank from '../components/DiscographyRank';
import { getDiscography } from '../services/api';
import { useSettings } from '../context/SettingsContext';

function Discography() {
  const { artist } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const artistName = decodeURIComponent(artist || '');

  const fetchPage = useCallback(async (pageNum) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDiscography(artistName, pageNum, settings.sortOrder);
      setData(result);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [artistName, settings.sortOrder]);

  useEffect(() => {
    if (artistName) fetchPage(1);
  }, [artistName, settings.sortOrder]);

  const sortLabel = settings.sortOrder === 'date' ? 'par date' :
                    settings.sortOrder === 'relevance' ? 'par pertinence' : 'par note pondérée';

  return (
    <main className="page">
      <button
        className="btn btn-secondary"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 20 }}
        aria-label="Retour"
      >
        ← Retour
      </button>

      <header className="page-header">
        <h1 className="page-title">🎶 Discographie</h1>
        <p className="page-subtitle">{artistName}</p>
        {data && !isLoading && (
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 4 }}>
            {data.total} album{data.total !== 1 ? 's' : ''} · classés {sortLabel} · page {page}
          </p>
        )}
      </header>

      {error && (
        <div className="error-message" role="alert">Erreur : {error}</div>
      )}

      <DiscographyRank releases={data?.releases} isLoading={isLoading} />

      {!isLoading && data && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {page > 1 && (
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => fetchPage(page - 1)}
              disabled={isLoading}
            >
              ← Précédent
            </button>
          )}
          {data.hasMore && (
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => fetchPage(page + 1)}
              disabled={isLoading}
            >
              Suivant →
            </button>
          )}
        </div>
      )}
    </main>
  );
}

export default Discography;
