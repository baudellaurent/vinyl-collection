import React, { useEffect, useRef, useState } from 'react';

function BarcodeScanner({ onScan, onError }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const streamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let active = true;

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        if (!active) return;

        // Request camera stream directly — prefer back camera on mobile
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setIsLoading(false);

        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        // Decode from the video element directly
        reader.decodeFromVideoElement(videoRef.current, (result, err) => {
          if (!active) return;
          if (result) {
            onScan?.(result.getText());
          }
        });
      } catch (err) {
        if (!active) return;
        setIsLoading(false);

        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          setPermissionDenied(true);
          onError?.("Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
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
