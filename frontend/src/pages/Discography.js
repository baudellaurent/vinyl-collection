import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DiscographyRank from '../components/DiscographyRank';
import { getDiscography } from '../services/api';

function Discography() {
  const { artist } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const artistName = decodeURIComponent(artist || '');

  useEffect(() => {
    async function fetchDiscography() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getDiscography(artistName);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (artistName) {
      fetchDiscography();
    }
  }, [artistName]);

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
            {data.total} album{data.total !== 1 ? 's' : ''} · classés par note pondérée
          </p>
        )}
      </header>

      {error && (
        <div className="error-message" role="alert">
          Erreur : {error}
        </div>
      )}

      <DiscographyRank releases={data?.releases} isLoading={isLoading} />
    </main>
  );
}

export default Discography;
