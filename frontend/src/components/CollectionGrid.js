import React from 'react';
import { useNavigate } from 'react-router-dom';
import AlbumCard from './AlbumCard';

function ListItem({ album }) {
  const navigate = useNavigate();
  return (
    <div
      className="search-result-item"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/album/${album.discogs_id || album.id}`, { state: { album } })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/album/${album.discogs_id || album.id}`, { state: { album } })}
      aria-label={`${album.title} par ${album.artist}`}
    >
      {album.cover_url ? (
        <img
          className="search-result-cover"
          src={album.cover_url}
          alt={`${album.title} cover`}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="search-result-cover flex-center" style={{ background: 'var(--bg-secondary)', borderRadius: 6 }} aria-hidden="true">
          🎵
        </div>
      )}
      <div className="search-result-info">
        <div className="search-result-title">{album.title}</div>
        <div className="search-result-artist">{album.artist}</div>
        <div className="search-result-meta">
          {album.year && <span>{album.year}</span>}
          {album.genre && <span> · {album.genre}</span>}
        </div>
      </div>
      {album.inCollection !== false && (
        <span className="in-collection-badge" style={{ position: 'static', flexShrink: 0 }} aria-hidden="true">✓</span>
      )}
    </div>
  );
}

function CollectionGrid({ vinyls, onAlbumClick, emptyMessage, viewMode = 'grid' }) {
  if (!vinyls || vinyls.length === 0) {
    return (
      <div className="empty-state" role="status">
        <div className="empty-icon" aria-hidden="true">🎵</div>
        <h3>Collection vide</h3>
        <p>{emptyMessage || 'Ajoutez des vinyles en scannant un code-barres ou en faisant une recherche.'}</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <section
        className="search-results"
        aria-label={`${vinyls.length} vinyl${vinyls.length > 1 ? 's' : ''} dans la collection`}
      >
        {vinyls.map((vinyl) => (
          <ListItem key={vinyl.id || `${vinyl.title}-${vinyl.artist}`} album={vinyl} />
        ))}
      </section>
    );
  }

  return (
    <section
      className="collection-grid"
      aria-label={`${vinyls.length} vinyl${vinyls.length > 1 ? 's' : ''} dans la collection`}
    >
      {vinyls.map((vinyl) => (
        <AlbumCard
          key={vinyl.id || `${vinyl.title}-${vinyl.artist}`}
          album={vinyl}
          onClick={onAlbumClick}
        />
      ))}
    </section>
  );
}

export default CollectionGrid;
