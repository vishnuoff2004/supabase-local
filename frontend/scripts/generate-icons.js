let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('sharp not available. Install with: npm install --save-dev sharp');
  console.log('Checking if icons already exist...');
  const fs = require('fs');
  const path = require('path');
  const required = ['icon-192x192.png', 'icon-512x512.png'];
  const missing = required.filter(f => !fs.existsSync(path.join(__dirname, '..', 'public', 'icons', f)));
  if (missing.length > 0) {
    console.warn('Missing icons:', missing.join(', '));
    console.warn('Create placeholder PNG files or install sharp to auto-generate them.');
  } else {
    console.log('All icons already exist.');
  }
  process.exit(0);
}

const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const outputDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function svgIcon(size) {
  const r = Math.round(size * 0.15);
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0D530E;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a8a1a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.35}" fill="white" opacity="0.15"/>
  <text x="50%" y="${size * 0.55}" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="800"
        font-size="${size * 0.4}" fill="white">TP</text>
</svg>`;
}

async function generate() {
  for (const size of sizes) {
    const svg = svgIcon(size);
    const filePath = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(filePath);
    console.log(`Generated: ${filePath}`);
  }
  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(0);
});
