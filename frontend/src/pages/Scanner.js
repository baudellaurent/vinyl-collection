import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import { searchBarcode, addToCollection, removeFromCollectionByDiscogsId } from '../services/api';

function Scanner() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const lastScannedRef = useRef(null);
  const cooldownRef = useRef(false);

  const handleScan = useCallback(async (barcode) => {
    if (cooldownRef.current || lastScannedRef.current === barcode) return;
    cooldownRef.current = true;
    lastScannedRef.current = barcode;
    setTimeout(() => { cooldownRef.current = false; }, 3000);

    setIsSearching(true);
    setError(null);
    setAddSuccess(false);
    setScanResult(null);

    try {
      const data = await searchBarcode(barcode);
      setScanResult({ ...data, barcode });
    } catch (err) {
      setError(`Erreur lors de la recherche : ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleCameraError = useCallback((msg) => {
    setError(msg);
  }, []);

  const handleAdd = async () => {
    if (!scanResult?.album) return;
    setIsAdding(true);
    setError(null);
    try {
      await addToCollection({
        barcode: scanResult.barcode,
        discogs_id: scanResult.album.id,
        title: scanResult.album.title,
        artist: scanResult.album.artist,
        year: scanResult.album.year,
        genre: scanResult.album.genre,
        cover_url: scanResult.album.cover_url,
        discogs_rating: scanResult.album.rating,
        discogs_rating_count: scanResult.album.rating_count,
      });
      setAddSuccess(true);
      setScanResult((prev) => ({ ...prev, inCollection: true }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async () => {
    if (!scanResult?.album?.id) return;
    setIsRemoving(true);
    setError(null);
    try {
      await removeFromCollectionByDiscogsId(scanResult.album.id);
      setScanResult((prev) => ({ ...prev, inCollection: false }));
      setAddSuccess(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setError(null);
    setAddSuccess(false);
    lastScannedRef.current = null;
  };

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">📷 Scanner</h1>
        <p className="page-subtitle">Pointez la caméra vers le code-barres du vinyle</p>
      </header>

      {error && (
        <div className="error-message" role="alert">{error}</div>
      )}

      {addSuccess && (
        <div className="success-message" role="status">
          ✓ Vinyle ajouté à votre collection !
        </div>
      )}

      {isSearching && (
        <div className="loading" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <span>Recherche en cours...</span>
        </div>
      )}

      {!scanResult && !isSearching && (
        <BarcodeScanner onScan={handleScan} onError={handleCameraError} />
      )}

      {scanResult && (
        <div className="scanner-result">
          {!scanResult.found ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">❓</div>
              <h3>Album non trouvé</h3>
              <p>Code-barres : <code>{scanResult.barcode}</code></p>
              <p className="mt-8">Essayez la recherche manuelle.</p>
            </div>
          ) : (
            <div>
              <div className="search-result-item" style={{ marginBottom: 16 }}>
                {scanResult.album?.cover_url ? (
                  <img
                    className="search-result-cover"
                    src={scanResult.album.cover_url}
                    alt={`${scanResult.album.title} cover`}
                  />
                ) : (
                  <div className="search-result-cover flex-center" aria-hidden="true">🎵</div>
                )}
                <div className="search-result-info">
                  <div className="search-result-title">{scanResult.album?.title}</div>
                  <div className="search-result-artist">{scanResult.album?.artist}</div>
                  <div className="search-result-meta">
                    {scanResult.album?.year && <span>{scanResult.album.year}</span>}
                    {scanResult.album?.genre && <span> · {scanResult.album.genre}</span>}
                  </div>
                </div>
              </div>

              {scanResult.inCollection ? (
                <button
                  className="btn btn-full"
                  onClick={handleRemove}
                  disabled={isRemoving}
                  style={{ background: '#c0392b', color: 'white', marginBottom: 8 }}
                >
                  {isRemoving ? 'Suppression...' : '🗑 Retirer de la collection'}
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleAdd}
                  disabled={isAdding || addSuccess}
                >
                  {isAdding ? 'Ajout en cours...' : '+ Ajouter à la collection'}
                </button>
              )}

              <button
                className="btn btn-secondary btn-full mt-8"
                onClick={() => navigate(`/album/${scanResult.album?.id}`, { state: { album: scanResult.album } })}
                style={{ marginTop: 8 }}
              >
                Voir les détails
              </button>
            </div>
          )}

          <button
            className="btn btn-secondary btn-full"
            onClick={handleReset}
            style={{ marginTop: 12 }}
          >
            Scanner un autre vinyle
          </button>
        </div>
      )}
    </main>
  );
}

export default Scanner;

function Scanner() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const lastScannedRef = useRef(null);
  const cooldownRef = useRef(false);

  const handleScan = useCallback(async (barcode) => {
    // Debounce: ignore duplicate scans within 3 seconds
    if (cooldownRef.current || lastScannedRef.current === barcode) return;
    cooldownRef.current = true;
    lastScannedRef.current = barcode;
    setTimeout(() => { cooldownRef.current = false; }, 3000);

    setIsSearching(true);
    setError(null);
    setAddSuccess(false);
    setScanResult(null);

    try {
      const data = await searchBarcode(barcode);
      setScanResult({ ...data, barcode });
    } catch (err) {
      setError(`Erreur lors de la recherche : ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleCameraError = useCallback((msg) => {
    setError(msg);
  }, []);

  const handleAdd = async () => {
    if (!scanResult?.album) return;
    setIsAdding(true);
    setError(null);
    try {
      await addToCollection({
        barcode: scanResult.barcode,
        discogs_id: scanResult.album.id,
        title: scanResult.album.title,
        artist: scanResult.album.artist,
        year: scanResult.album.year,
        genre: scanResult.album.genre,
        cover_url: scanResult.album.cover_url,
        discogs_rating: scanResult.album.rating,
        discogs_rating_count: scanResult.album.rating_count,
      });
      setAddSuccess(true);
      setScanResult((prev) => ({ ...prev, inCollection: true }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setError(null);
    setAddSuccess(false);
    lastScannedRef.current = null;
  };

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">📷 Scanner</h1>
        <p className="page-subtitle">Pointez la caméra vers le code-barres du vinyle</p>
      </header>

      {error && (
        <div className="error-message" role="alert">{error}</div>
      )}

      {addSuccess && (
        <div className="success-message" role="status">
          ✓ Vinyle ajouté à votre collection !
        </div>
      )}

      {isSearching && (
        <div className="loading" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <span>Recherche en cours...</span>
        </div>
      )}

      {!scanResult && !isSearching && (
        <BarcodeScanner onScan={handleScan} onError={handleCameraError} />
      )}

      {scanResult && (
        <div className="scanner-result">
          {!scanResult.found ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">❓</div>
              <h3>Album non trouvé</h3>
              <p>Code-barres : <code>{scanResult.barcode}</code></p>
              <p className="mt-8">Essayez la recherche manuelle.</p>
            </div>
          ) : (
            <div>
              <div className="search-result-item" style={{ marginBottom: 16 }}>
                {scanResult.album?.cover_url ? (
                  <img
                    className="search-result-cover"
                    src={scanResult.album.cover_url}
                    alt={`${scanResult.album.title} cover`}
                  />
                ) : (
                  <div className="search-result-cover flex-center" aria-hidden="true">🎵</div>
                )}
                <div className="search-result-info">
                  <div className="search-result-title">{scanResult.album?.title}</div>
                  <div className="search-result-artist">{scanResult.album?.artist}</div>
                  <div className="search-result-meta">
                    {scanResult.album?.year && <span>{scanResult.album.year}</span>}
                    {scanResult.album?.genre && <span> · {scanResult.album.genre}</span>}
                  </div>
                </div>
              </div>

              {scanResult.inCollection ? (
                <div className="success-message">✓ Déjà dans votre collection</div>
              ) : (
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleAdd}
                  disabled={isAdding || addSuccess}
                >
                  {isAdding ? 'Ajout en cours...' : '+ Ajouter à la collection'}
                </button>
              )}

              <button
                className="btn btn-secondary btn-full mt-8"
                onClick={() => navigate(`/album/${scanResult.album?.id}`, { state: { album: scanResult.album } })}
                style={{ marginTop: 8 }}
              >
                Voir les détails
              </button>
            </div>
          )}

          <button
            className="btn btn-secondary btn-full"
            onClick={handleReset}
            style={{ marginTop: 12 }}
          >
            Scanner un autre vinyle
          </button>
        </div>
      )}
    </main>
  );
}

export default Scanner;
