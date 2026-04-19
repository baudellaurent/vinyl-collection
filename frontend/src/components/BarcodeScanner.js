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
        // Dynamically import to avoid SSR issues
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        if (!active) return;

        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!active) return;

        if (devices.length === 0) {
          onError?.('Aucune caméra détectée sur cet appareil.');
          setIsLoading(false);
          return;
        }

        // Prefer back camera on mobile
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        );
        const deviceId = backCamera ? backCamera.deviceId : devices[0].deviceId;

        setIsLoading(false);

        await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
          if (!active) return;
          if (result) {
            onScan?.(result.getText());
          }
          // Ignore continuous "not found" errors — they're expected between frames
        });
      } catch (err) {
        if (!active) return;
        setIsLoading(false);

        if (
          err.name === 'NotAllowedError' ||
          err.message?.includes('Permission')
        ) {
          setPermissionDenied(true);
          onError?.('Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.');
        } else {
          onError?.(`Erreur caméra: ${err.message}`);
        }
      }
    }

    startScanner();

    return () => {
      active = false;
      if (readerRef.current) {
        try {
          readerRef.current.reset();
        } catch (_) {}
      }
    };
  }, [onScan, onError]);

  if (permissionDenied) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">🚫</div>
        <h3>Accès caméra refusé</h3>
        <p>
          Autorisez l'accès à la caméra dans les paramètres de votre navigateur,
          puis rechargez la page.
        </p>
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
        style={{ display: isLoading ? 'none' : 'block' }}
      />
      {!isLoading && (
        <div className="scanner-overlay" aria-hidden="true">
          <div className="scanner-frame" />
        </div>
      )}
    </div>
  );
}

export default BarcodeScanner;
