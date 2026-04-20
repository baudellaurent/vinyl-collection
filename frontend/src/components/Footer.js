import React from 'react';

// These are injected at build time via react-scripts (REACT_APP_ prefix)
const VERSION = process.env.REACT_APP_VERSION || '1.1.0';
const BUILD_DATE = process.env.REACT_APP_BUILD_DATE || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '12px 16px',
      paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      fontSize: '0.7rem',
      color: 'var(--text-muted)',
      borderTop: '1px solid var(--border)',
      marginTop: 24,
    }}>
      CLHV-Solutions · All rights reserved · {BUILD_DATE} · v{VERSION}
    </footer>
  );
}

export default Footer;
