import React from 'react';

// These are injected at build time via react-scripts (REACT_APP_ prefix)
const VERSION = process.env.REACT_APP_VERSION || '1.1.0';
const BUILD_DATE = process.env.REACT_APP_BUILD_DATE || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

function Footer() {
  return (
    <footer style={{
      position: 'fixed',
      bottom: 'var(--nav-height)',
      left: 0,
      right: 0,
      textAlign: 'center',
      padding: '4px 16px',
      fontSize: '0.65rem',
      color: 'var(--text-muted)',
      background: 'var(--bg-primary)',
      borderTop: '1px solid var(--border)',
      zIndex: 99,
    }}>
      CLHV-Solutions · All rights reserved · {BUILD_DATE} · v{VERSION}
    </footer>
  );
}

export default Footer;
