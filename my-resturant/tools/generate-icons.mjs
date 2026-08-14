import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
const iconsDir = path.join(publicDir, 'icons');
const candidates = [
  'my-logo.png',
  'my-logo.jpg',
  'my-logo.jpeg',
  'my-logoo.png',
  'my-logoo.jpg'
].map(name => path.join(publicDir, name));

let srcImage = null;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    srcImage = p;
    break;
  }
}

if (!srcImage) {
  console.error('Source image not found. Checked:', candidates.join(', '));
  process.exit(1);
}

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const outputs = [
  { size: 512, name: 'my-logo-512.png' },
  { size: 192, name: 'my-logo-192.png' },
  { size: 32, name: 'favicon-32x32.png' }
];

// also produce flattened (white background) versions to avoid dark edges on some OS
const outputsWhite = [
  { size: 512, name: 'my-logo-512-white.png' },
  { size: 192, name: 'my-logo-192-white.png' },
  { size: 32, name: 'favicon-32x32-white.png' }
];

const maskableOutput = { size: 512, name: 'my-logo-maskable-512.png' };
const screenshotsDir = path.join(publicDir, 'screenshots');
const screenshots = [
  { width: 1280, height: 720, name: 'wide-1280x720.png' },
  { width: 640, height: 960, name: 'phone-640x960.png' }
];

(async function generate() {
  try {
    for (const out of outputs) {
      const outPath = path.join(iconsDir, out.name);
      await sharp(srcImage)
        .resize(out.size, out.size, { fit: 'cover' })
        .png({ quality: 90 })
        .toFile(outPath);
      console.log('Written', outPath);
    }
    // generate white-background versions
    for (const out of outputsWhite) {
      const outPath = path.join(iconsDir, out.name);
      await sharp(srcImage)
        .resize(out.size, out.size, { fit: 'cover' })
        .png({ quality: 90 })
        .flatten({ background: '#ffffff' })
        .toFile(outPath);
      console.log('Written', outPath);
    }
    // generate maskable icon: scale content smaller and add transparent padding to ensure safe zone
    const maskPath = path.join(iconsDir, maskableOutput.name);
    await sharp(srcImage)
      .resize(420, 420, { fit: 'cover' })
      .png({ quality: 90 })
      .extend({ top: 46, bottom: 46, left: 46, right: 46, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(maskPath);
    console.log('Written', maskPath);

    // generate screenshots
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
    for (const shot of screenshots) {
      const outPath = path.join(screenshotsDir, shot.name);
      await sharp(srcImage)
        .resize(shot.width, shot.height, { fit: 'cover' })
        .png({ quality: 90 })
        .toFile(outPath);
      console.log('Written', outPath);
    }
    console.log('All icons generated.');
  } catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
  }
})();
