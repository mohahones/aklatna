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
    console.log('All icons generated.');
  } catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
  }
})();
