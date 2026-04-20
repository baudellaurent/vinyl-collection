import React, { useEffect, useRef, useState } from 'react';

function BarcodeScanner({ onScan, onError }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let active = true;

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader, BrowserCodeReader } = await import('@zxing/library');
        if (!active) return;

        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        // Use constraints to prefer back camera
        const hints = new Map();
        const videoConstraints = {
          facingMode: { ideal: 'environment' },
        };

        setIsLoading(false);

        // decodeFromConstraints is the most reliable method across ZXing versions
        await reader.decodeFromConstraints(
          { video: videoConstraints },
          videoRef.current,
          (result, err) => {
            if (!active) return;
            if (result) {
              onScan?.(result.getText());
            }
            // err here is just "not found in frame" — normal, ignore it
          }
        );
      } catch (err) {
        if (!active) return;
        setIsLoading(false);

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
          onError?.("Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres.");
        } else if (err.name === 'NotFoundError') {
          onError?.('Aucune caméra détectée sur cet appareil.');
        } else {
          onError?.(`Erreur caméra: ${err.message}`);
        }
      }
    }

    startScanner();

    return () => {
      active = false;
      if (readerRef.current) {
        try { readerRef.current.reset(); } catch (_) {}
      }
    };
  }, [onScan, onError]);

  if (permissionDenied) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">🚫</div>
        <h3>Accès caméra refusé</h3>
        <p>Autorisez l'accès à la caméra dans les paramètres, puis rechargez la page.</p>
      </div>
    );
  }

  return (
    <div className="scanner-container">
      {isLoading && (
        <div className="loading" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <span>Initialisation de la caméra...</span>
        </div>
      )}
      <video
        ref={videoRef}
        className="scanner-video"
        aria-label="Flux caméra pour scanner le code-barres"
        playsInline
        muted
      />
      <div className="scanner-overlay" aria-hidden="true">
        <div className="scanner-frame" />
      </div>
    </div>
  );
}

export default BarcodeScanner;
