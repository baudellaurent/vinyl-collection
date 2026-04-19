import React from 'react';
import AlbumCard from './AlbumCard';

function CollectionGrid({ vinyls, onAlbumClick, emptyMessage }) {
  if (!vinyls || vinyls.length === 0) {
    return (
      <div className="empty-state" role="status">
        <div className="empty-icon" aria-hidden="true">🎵</div>
        <h3>Collection vide</h3>
        <p>{emptyMessage || 'Ajoutez des vinyles en scannant un code-barres ou en faisant une recherche.'}</p>
      </div>
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
