import React from 'react';
import { useNavigate } from 'react-router-dom';

function StarRating({ rating }) {
  if (!rating) return null;
  const stars = Math.round(rating / 1); // Discogs rates 0-5
  const display = rating.toFixed(2);
  return (
    <div className="album-rating" aria-label={`Rating: ${display} out of 5`}>
      <span>★</span>
      <span>{display}</span>
    </div>
  );
}

function AlbumCard({ album, onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(album);
    } else if (album.id) {
      navigate(`/album/${album.id}`, { state: { album } });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className="album-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${album.title} by ${album.artist}`}
    >
      {album.inCollection && (
        <span className="in-collection-badge" aria-label="In your collection">✓</span>
      )}

      {album.cover_url ? (
        <img
          className="album-cover"
          src={album.cover_url}
          alt={`${album.title} cover`}
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div
        className="album-cover-placeholder"
        style={{ display: album.cover_url ? 'none' : 'flex' }}
        aria-hidden="true"
      >
        🎵
      </div>

      <div className="album-info">
        <div className="album-title" title={album.title}>{album.title}</div>
        <div className="album-artist" title={album.artist}>{album.artist}</div>
        {album.year && <div className="album-year">{album.year}</div>}
        <StarRating rating={album.rating || album.discogs_rating} />
      </div>
    </article>
  );
}

export default AlbumCard;
