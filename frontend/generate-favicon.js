const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgContent = fs.readFileSync(path.join(__dirname, 'public/favicon.svg'));

// Generate 192x192 PNG for apple-touch-icon and PWA
sharp(svgContent)
  .resize(192, 192)
  .png()
  .toFile(path.join(__dirname, 'public/apple-touch-icon.png'))
  .then(() => {
    console.log('Generated apple-touch-icon.png (192x192)');
    // Also generate 512x512 for PWA manifest
    return sharp(svgContent)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, 'public/logo512.png'));
  })
  .then(() => {
    console.log('Generated logo512.png (512x512)');
    // Generate 32x32 favicon
    return sharp(svgContent)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, 'public/favicon-32.png'));
  })
  .then(() => console.log('All favicons generated!'))
  .catch(console.error);
