import React, { useState } from 'react';
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
        <img className="search-result-cover" src={album.cover_url} alt={`${album.title} cover`} loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <div className="search-result-cover flex-center" style={{ background: 'var(--bg-secondary)', borderRadius: 6 }} aria-hidden="true">🎵</div>
      )}
      <div className="search-result-info">
        <div className="search-result-title">{album.title}</div>
        <div className="search-result-artist">{album.artist}</div>
        <div className="search-result-meta">
          {album.year && <span>{album.year}</span>}
          {album.genre && <span> · {album.genre}</span>}
        </div>
      </div>
    </div>
  );
}

// Group vinyls by first letter of artist
function groupByLetter(vinyls) {
  const groups = {};
  vinyls.forEach((v) => {
    const artist = v.artist || '?';
    // Remove "The ", "Les ", "A " prefixes for sorting
    const sortName = artist.replace(/^(the |les |a |an |de |le |la )/i, '').trim();
    const letter = sortName[0]?.toUpperCase() || '#';
    const key = /[A-Z]/.test(letter) ? letter : '#';
    if (!groups[key]) groups[key] = [];
    groups[key].push(v);
  });
  return groups;
}

function AlphaIndex({ letters, activeLetter, onSelect }) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 16,
      justifyContent: 'center',
    }}>
      {letters.map((letter) => (
        <button
          key={letter}
          onClick={() => onSelect(letter)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: 'none',
            background: activeLetter === letter ? 'var(--accent)' : 'var(--bg-card)',
            color: activeLetter === letter ? 'white' : 'var(--text-secondary)',
            fontSize: '0.8rem',
            fontWeight: activeLetter === letter ? 700 : 400,
            cursor: 'pointer',
            minWidth: 28,
          }}
          aria-label={`Artistes commençant par ${letter}`}
        >
          {letter}
        </button>
      ))}
      {activeLetter && (
        <button
          onClick={() => onSelect(null)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            cursor: 'pointer',
          }}
        >
          ✕ Tout
        </button>
      )}
    </div>
  );
}

function CollectionGrid({ vinyls, onAlbumClick, emptyMessage, viewMode = 'grid' }) {
  const [activeLetter, setActiveLetter] = useState(null);

  if (!vinyls || vinyls.length === 0) {
    return (
      <div className="empty-state" role="status">
        <div className="empty-icon" aria-hidden="true">🎵</div>
        <h3>Collection vide</h3>
        <p>{emptyMessage || 'Ajoutez des vinyles en scannant un code-barres ou en faisant une recherche.'}</p>
      </div>
    );
  }

  const groups = groupByLetter(vinyls);
  const letters = Object.keys(groups).sort();

  // Filter by active letter
  const filtered = activeLetter
    ? (groups[activeLetter] || [])
    : vinyls;

  if (viewMode === 'list') {
    return (
      <>
        <AlphaIndex letters={letters} activeLetter={activeLetter} onSelect={setActiveLetter} />
        {!activeLetter ? (
          letters.map((letter) => (
            <div key={letter}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', padding: '8px 0 4px', letterSpacing: 1 }}>{letter}</div>
              <section className="search-results" style={{ marginBottom: 8 }}>
                {groups[letter].map((vinyl) => (
                  <ListItem key={vinyl.id} album={vinyl} />
                ))}
              </section>
            </div>
          ))
        ) : (
          <section className="search-results">
            {filtered.map((vinyl) => <ListItem key={vinyl.id} album={vinyl} />)}
          </section>
        )}
      </>
    );
  }

  return (
    <>
      <AlphaIndex letters={letters} activeLetter={activeLetter} onSelect={setActiveLetter} />
      {!activeLetter ? (
        letters.map((letter) => (
          <div key={letter}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', padding: '8px 0 4px', letterSpacing: 1 }}>{letter}</div>
            <section className="collection-grid" style={{ marginBottom: 16 }}>
              {groups[letter].map((vinyl) => (
                <AlbumCard key={vinyl.id} album={vinyl} onClick={onAlbumClick} />
              ))}
            </section>
          </div>
        ))
      ) : (
        <section className="collection-grid">
          {filtered.map((vinyl) => <AlbumCard key={vinyl.id} album={vinyl} onClick={onAlbumClick} />)}
        </section>
      )}
    </>
  );
}

export default CollectionGrid;
