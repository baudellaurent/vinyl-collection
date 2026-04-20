import React from 'react';

function RatingDisplay({ rating, count }) {
  if (!rating) return null;
  return (
    <div className="discography-rating" aria-label={`Note: ${rating.toFixed(2)}/5 (${count || 0} votes)`}>
      ★ {rating.toFixed(2)}
      {count ? <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({count})</span> : null}
    </div>
  );
}

function DiscographyRank({ releases, isLoading }) {
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
    <ol className="discography-list" aria-label="Classement de la discographie">
      {releases.map((release) => (
        <li
          key={release.id || release.rank}
          className={`discography-item${release.inCollection ? ' in-collection' : ''}`}
          aria-label={`#${release.rank} ${release.title}${release.inCollection ? ' - dans votre collection' : ''}`}
        >
          <span className="discography-rank" aria-hidden="true">
            #{release.rank}
          </span>

          {release.cover_url ? (
            <img
              className="discography-cover"
              src={release.cover_url}
              alt={`${release.title} cover`}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="discography-cover-placeholder"
            style={{ display: release.cover_url ? 'none' : 'flex' }}
            aria-hidden="true"
          >
            🎵
          </div>

          <div className="discography-info">
            <div className="discography-title">{release.title}</div>
            {release.year && (
              <div className="discography-year">{release.year}</div>
            )}
            <RatingDisplay rating={release.rating} count={release.rating_count} />
            {release.want && (
              <div className="discography-rating" style={{ color: 'var(--text-muted)' }}>
                ❤️ {release.want.toLocaleString()} popularité
              </div>
            )}
          </div>

          {release.inCollection && (
            <span
              className="in-collection-badge"
              style={{ position: 'static', marginLeft: 'auto' }}
              aria-hidden="true"
            >
              ✓
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export default DiscographyRank;
