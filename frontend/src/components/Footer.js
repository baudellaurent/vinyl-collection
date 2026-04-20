import React from 'react';

const VERSION = process.env.REACT_APP_VERSION || '1.2.0';
const BUILD_DATE = process.env.REACT_APP_BUILD_DATE || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export { VERSION, BUILD_DATE };

function Footer() {
  return null; // Footer is now integrated into BottomNav in App.js
}

export default Footer;
