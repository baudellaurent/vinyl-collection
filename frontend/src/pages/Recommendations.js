import React, { useState, useEffect } from 'react';
import { getRecommendations, addToCollection, removeFromCollectionByDiscogsId } from '../services/api';

// ── Taste Profile Banner ────────────────────────────────────────────────────

function TasteProfile({ profile }) {
  if (!profile) return null;
  const { genres, topDecade, popularityTier } = profile;

  return (
    <div className="reco-profile">
      <div className="reco-profile-label">Ton profil musical</div>
      <div className="reco-profile-chips">
        {genres.slice(0, 3).map((g) => (
          <span key={g.name} className="reco-chip">
            {g.name} <strong>{g.pct}%</strong>
          </span>
        ))}
        {topDecade && (
          <span className="reco-chip reco-chip--era">Années {topDecade}</span>
        )}
        <span className={`reco-chip reco-chip--tier ${popularityTier === 'mainstream' ? 'reco-chip--mainstream' : 'reco-chip--culte'}`}>
          {popularityTier === 'mainstream' ? 'Mainstream' : 'Culte / Rare'}
        </span>
      </div>
    </div>
  );
}

// ── Add/Remove Modal ────────────────────────────────────────────────────────

function RecoModal({ release, onClose, onAdd, onRemove, isActing }) {
  if (!release) return null;
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
      aria-label={release.title}
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
        {release.cover_url ? (
          <img src={release.cover_url} alt={release.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '1', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>🎵</div>
        )}

        <div style={{ padding: 20 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{release.title}</h2>
          <div style={{ color: 'var(--accent)', marginBottom: 8 }}>{release.artist}</div>

          <div style={{ display: 'flex', gap: 10, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 8, flexWrap: 'wrap' }}>
            {release.year && <span>📅 {release.year}</span>}
            {release.genre && <span>🎸 {release.genre}</span>}
            {release.want && <span>❤️ {Number(release.want).toLocaleString()}</span>}
          </div>

          {release.reason && (
            <div className="reco-modal-reason">💡 {release.reason}</div>
          )}

          {release.inCollection ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
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
              style={{ marginTop: 12 }}
            >
              {isActing ? 'Ajout...' : '+ Ajouter à la collection'}
            </button>
          )}

          <button className="btn btn-secondary btn-full" onClick={onClose} style={{ marginTop: 8 }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Horizontal Scroll Section ───────────────────────────────────────────────

function RecoSection({ title, subtitle, items, onSelect }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="reco-section">
      <h2 className="reco-section-title">{title}</h2>
      {subtitle && <p className="reco-section-subtitle">{subtitle}</p>}
      <div className="reco-scroll">
        {items.map((item, i) => (
          <div
            key={item.id || i}
            className="reco-card"
            onClick={() => onSelect(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(item)}
            aria-label={`${item.title} — ${item.artist}`}
          >
            {item.inCollection && (
              <span className="in-collection-badge" aria-label="Dans ta collection">✓</span>
            )}
            {item.cover_url ? (
              <img
                className="reco-card-cover"
                src={item.cover_url}
                alt={item.title}
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div className="reco-card-cover reco-card-cover--placeholder" style={{ display: item.cover_url ? 'none' : 'flex' }} aria-hidden="true">🎵</div>
            <div className="reco-card-info">
              <div className="reco-card-title" title={item.title}>{item.title}</div>
              <div className="reco-card-artist" title={item.artist}>{item.artist}</div>
              {item.year && <div className="reco-card-year">{item.year}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Discovery Grid Section ──────────────────────────────────────────────────

function DiscoverySection({ items, onSelect }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="reco-section">
      <h2 className="reco-section-title">Nouvelles découvertes</h2>
      <p className="reco-section-subtitle">Artistes que tu ne possèdes pas encore, dans ton style</p>
      <div className="collection-grid">
        {items.map((item, i) => (
          <article
            key={item.id || i}
            className="album-card"
            onClick={() => onSelect(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(item)}
            aria-label={`${item.title} — ${item.artist}`}
          >
            {item.cover_url ? (
              <img
                className="album-cover"
                src={item.cover_url}
                alt={item.title}
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div className="album-cover-placeholder" style={{ display: item.cover_url ? 'none' : 'flex' }} aria-hidden="true">🎵</div>
            <div className="album-info">
              <div className="album-title" title={item.title}>{item.title}</div>
              <div className="album-artist">{item.artist}</div>
              {item.year && <div className="album-year">{item.year}</div>}
              {item.reason && <div className="reco-item-reason">💡 {item.reason}</div>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

function Recommendations() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isActing, setIsActing] = useState(false);
  const [message, setMessage] = useState(null);

  // Local optimistic state for all sections merged
  const [allItems, setAllItems] = useState([]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getRecommendations();
        setData(result);
        setAllItems([...( result.byArtist || []), ...(result.byGenre || []), ...(result.byDiscovery || [])]);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  function getSection(key) {
    return allItems.filter((i) => i.section === key);
  }

  function updateItem(id, patch) {
    setAllItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
    setSelected((prev) => prev?.id === id ? { ...prev, ...patch } : prev);
  }

  const handleAdd = async (release) => {
    setIsActing(true);
    try {
      await addToCollection({
        discogs_id: release.id,
        master_id: release.id,
        title: release.title,
        artist: release.artist,
        year: release.year,
        genre: release.genre,
        cover_url: release.cover_url,
      });
      updateItem(release.id, { inCollection: true });
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
      updateItem(release.id, { inCollection: false });
      setMessage('Retiré de votre collection.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(`Erreur : ${err.message}`);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">Recommandations</h1>
        <p className="page-subtitle">Basées sur ta collection</p>
      </header>

      {message && (
        <div className={message.startsWith('Erreur') ? 'error-message' : 'success-message'} style={{ marginBottom: 12 }}>
          {message}
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">Erreur : {error}</div>
      )}

      {isLoading ? (
        <div className="loading" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <span>Analyse de ta collection...</span>
        </div>
      ) : data?.testMode ? (
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <h3>Recommandations indisponibles</h3>
          <p>Les recommandations ne sont pas disponibles en mode test.</p>
        </div>
      ) : !data || (data.byArtist.length === 0 && data.byGenre.length === 0 && data.byDiscovery.length === 0) ? (
        <div className="empty-state">
          <div className="empty-icon">🎵</div>
          <h3>Collection trop petite</h3>
          <p>Ajoute quelques vinyles pour recevoir des recommandations personnalisées.</p>
        </div>
      ) : (
        <>
          <TasteProfile profile={data.profile} />

          <RecoSection
            title="Complète tes artistes"
            subtitle="Albums que tu ne possèdes pas encore, des artistes que tu collectionnes"
            items={getSection('byArtist')}
            onSelect={setSelected}
          />

          <RecoSection
            title="Dans ton style"
            subtitle="Les albums les plus convoités dans tes genres préférés"
            items={getSection('byGenre')}
            onSelect={setSelected}
          />

          <DiscoverySection
            items={getSection('byDiscovery')}
            onSelect={setSelected}
          />
        </>
      )}

      {selected && (
        <RecoModal
          release={selected}
          onClose={() => setSelected(null)}
          onAdd={handleAdd}
          onRemove={handleRemove}
          isActing={isActing}
        />
      )}
    </main>
  );
}

export default Recommendations;
