import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { addToCollection, removeFromCollection, removeFromCollectionByDiscogsId, getCollection } from '../services/api';

function AlbumDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [album, setAlbum] = useState(location.state?.album || null);
  const [inCollection, setInCollection] = useState(location.state?.album?.inCollection || false);
  const [collectionId, setCollectionId] = useState(null);
  const [isLoading, setIsLoading] = useState(!location.state?.album);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Check if this album is in the collection
  useEffect(() => {
    async function checkCollection() {
      try {
        const data = await getCollection();
        const albumDiscogsId = String(id || album?.id || album?.discogs_id || '');
        const found = data.vinyls?.find(
          (v) => String(v.discogs_id) === albumDiscogsId
        );
        if (found) {
          setInCollection(true);
          setCollectionId(found.id);
          // Only merge non-conflicting fields (don't overwrite title/artist from state)
          if (!album?.title) {
            setAlbum(found);
          }
        } else {
          setInCollection(false);
        }
      } catch (err) {
        console.error('Collection check failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    checkCollection();
  }, [id]);

  const handleAdd = async () => {
    if (!album) return;
    setIsActing(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await addToCollection({
        discogs_id: album.id || album.discogs_id,
        title: album.title,
        artist: album.artist,
        year: album.year,
        genre: album.genre,
        cover_url: album.cover_url,
        discogs_rating: album.rating || album.discogs_rating,
        discogs_rating_count: album.rating_count || album.discogs_rating_count,
      });
      setInCollection(true);
      setCollectionId(result.vinyl?.id);
      setSuccess('Vinyle ajouté à votre collection !');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsActing(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Retirer ce vinyle de votre collection ?')) return;
    setIsActing(true);
    setError(null);
    setSuccess(null);
    try {
      if (collectionId) {
        await removeFromCollection(collectionId);
      } else {
        // Fallback: remove by discogs_id
        await removeFromCollectionByDiscogsId(album.id || album.discogs_id);
      }
      setInCollection(false);
      setCollectionId(null);
      setSuccess('Vinyle retiré de votre collection.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="page">
        <div className="loading" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <span>Chargement...</span>
        </div>
      </main>
    );
  }

  if (!album) {
    return (
      <main className="page">
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">❓</div>
          <h3>Album introuvable</h3>
          <button className="btn btn-secondary mt-16" onClick={() => navigate(-1)}>
            ← Retour
          </button>
        </div>
      </main>
    );
  }

  const artistName = album.artist || '';
  const rating = album.rating || album.discogs_rating;
  const ratingCount = album.rating_count || album.discogs_rating_count;

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

      <div className="album-detail">
        <div className="album-detail-cover">
          {album.cover_url ? (
            <img src={album.cover_url} alt={`${album.title} cover`} />
          ) : (
            <div
              style={{
                width: '100%',
                aspectRatio: '1',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '5rem',
              }}
              aria-hidden="true"
            >
              🎵
            </div>
          )}
        </div>

        <div className="album-detail-info">
          <h1 className="album-detail-title">{album.title}</h1>
          <div className="album-detail-artist">{artistName}</div>
          <div className="album-detail-meta">
            {album.year && <span>📅 {album.year}</span>}
            {album.genre && <span>🎸 {album.genre}</span>}
            {rating && (
              <span>★ {Number(rating).toFixed(2)}{ratingCount ? ` (${ratingCount} votes)` : ''}</span>
            )}
          </div>
          {inCollection && (
            <div className="success-message mt-16">✓ Dans votre collection</div>
          )}
        </div>

        {error && <div className="error-message" role="alert">{error}</div>}
        {success && <div className="success-message" role="status">{success}</div>}

        <div className="album-detail-actions">
          {inCollection ? (
            <button
              className="btn btn-danger btn-full"
              onClick={handleRemove}
              disabled={isActing}
            >
              {isActing ? 'Suppression...' : '🗑 Retirer de la collection'}
            </button>
          ) : (
            <button
              className="btn btn-primary btn-full"
              onClick={handleAdd}
              disabled={isActing}
            >
              {isActing ? 'Ajout...' : '+ Ajouter à la collection'}
            </button>
          )}

          {artistName && (
            <button
              className="btn btn-secondary btn-full"
              onClick={() => navigate(`/discography/${encodeURIComponent(artistName)}`)}
            >
              🎶 Voir la discographie de {artistName}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default AlbumDetail;
