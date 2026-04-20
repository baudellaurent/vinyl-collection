import React, { useState } from 'react';
import { addToCollection, removeFromCollectionByDiscogsId } from '../services/api';

function RatingDisplay({ rating, count }) {
  if (!rating) return null;
  return (
    <div className="discography-rating" aria-label={`Note: ${rating.toFixed(2)}/5`}>
      ★ {Number(rating).toFixed(2)}
      {count ? <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({count})</span> : null}
    </div>
  );
}

function AlbumModal({ release, onClose, onAdd, onRemove, isActing }) {
  if (!release) return null;

  // Clean title: remove "Artist - " prefix
  const cleanTitle = (release.title || '').replace(/^[^-]+ - /i, '').trim() || release.title;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={cleanTitle}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius)',
          maxWidth: 400,
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover */}
        {release.cover_url ? (
          <img
            src={release.cover_url}
            alt={cleanTitle}
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', aspectRatio: '1',
            background: 'var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '5rem',
          }}>🎵</div>
        )}

        {/* Info */}
        <div style={{ padding: 20 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{cleanTitle}</h2>
          <div style={{ color: 'var(--accent)', marginBottom: 8 }}>{release.artist}</div>
          <div style={{ display: 'flex', gap: 12, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16, flexWrap: 'wrap' }}>
            {release.year && <span>📅 {release.year}</span>}
            {release.genre && <span>🎸 {release.genre}</span>}
            {release.want && <span>❤️ {Number(release.want).toLocaleString()}</span>}
          </div>

          {release.inCollection ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="success-message" style={{ margin: 0 }}>✓ Dans votre collection</div>
              <button
                className="btn btn-full"
                onClick={() => onRemove(release)}
                disabled={isActing}
                style={{ background: '#c0392b', color: 'white', border: 'none' }}
              >
                {isActing ? 'Suppression...' : '🗑 Retirer de la collection'}
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-full"
              onClick={() => onAdd(release)}
              disabled={isActing}
            >
              {isActing ? 'Ajout...' : '+ Ajouter à la collection'}
            </button>
          )}

          <button
            className="btn btn-secondary btn-full"
            onClick={onClose}
            style={{ marginTop: 8 }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscographyRank({ releases: initialReleases, isLoading }) {
  const [releases, setReleases] = useState(initialReleases || []);
  const [selected, setSelected] = useState(null);
  const [isActing, setIsActing] = useState(false);
  const [message, setMessage] = useState(null);

  // Sync when releases prop changes
  React.useEffect(() => {
    setReleases(initialReleases || []);
  }, [initialReleases]);

  const handleAdd = async (release) => {
    setIsActing(true);
    try {
      await addToCollection({
        discogs_id: release.id,
        title: release.title,
        artist: release.artist,
        year: release.year,
        genre: release.genre,
        cover_url: release.cover_url,
      });
      setReleases((prev) =>
        prev.map((r) => r.id === release.id ? { ...r, inCollection: true } : r)
      );
      setSelected((prev) => prev ? { ...prev, inCollection: true } : null);
      setMessage('✓ Ajouté à votre collection !');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(`Erreur : ${err.message}`);
    } finally {
      setIsActing(false);
    }
  };

  const handleRemove = async (release) => {
    setIsActing(true);
    try {
      await removeFromCollectionByDiscogsId(release.id);
      setReleases((prev) =>
        prev.map((r) => r.id === release.id ? { ...r, inCollection: false } : r)
      );
      setSelected((prev) => prev ? { ...prev, inCollection: false } : null);
      setMessage('Retiré de votre collection.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(`Erreur : ${err.message}`);
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <span>Chargement de la discographie...</span>
      </div>
    );
  }

  if (!releases || releases.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">🎶</div>
        <h3>Aucun album trouvé</h3>
        <p>Impossible de récupérer la discographie pour cet artiste.</p>
      </div>
    );
  }

  return (
    <>
      {message && (
        <div className={message.startsWith('Erreur') ? 'error-message' : 'success-message'} style={{ marginBottom: 12 }}>
          {message}
        </div>
      )}

      <ol className="discography-list" aria-label="Classement de la discographie">
        {releases.map((release) => (
          <li
            key={release.id || release.rank}
            className={`discography-item${release.inCollection ? ' in-collection' : ''}`}
            onClick={() => setSelected(release)}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelected(release)}
            aria-label={`#${release.rank} ${release.title}${release.inCollection ? ' - dans votre collection' : ''}`}
          >
            <span className="discography-rank" aria-hidden="true">#{release.rank}</span>

            {release.cover_url ? (
              <img
                className="discography-cover"
                src={release.cover_url}
                alt={`${release.title} cover`}
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className="discography-cover-placeholder"
              style={{ display: release.cover_url ? 'none' : 'flex' }}
              aria-hidden="true"
            >🎵</div>

            <div className="discography-info">
              <div className="discography-title">
                {(release.title || '').replace(/^[^-]+ - /i, '').trim() || release.title}
              </div>
              {release.year && <div className="discography-year">{release.year}</div>}
              <RatingDisplay rating={release.rating} count={release.rating_count} />
              {release.want && (
                <div className="discography-rating" style={{ color: 'var(--text-muted)' }}>
                  ❤️ {Number(release.want).toLocaleString()}
                </div>
              )}
            </div>

            {release.inCollection ? (
              <span className="in-collection-badge" style={{ position: 'static', marginLeft: 'auto' }} aria-hidden="true">✓</span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginLeft: 'auto' }} aria-hidden="true">＋</span>
            )}
          </li>
        ))}
      </ol>

      {selected && (
        <AlbumModal
          release={selected}
          onClose={() => setSelected(null)}
          onAdd={handleAdd}
          onRemove={handleRemove}
          isActing={isActing}
        />
      )}
    </>
  );
}

export default DiscographyRank;
