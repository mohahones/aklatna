import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
const iconsDir = path.join(publicDir, 'icons');
const cleanedPath = path.join(iconsDir, 'my-logo-cleaned.png');
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
// transparent rounded outputs (no white background)
const outputsTransparent = [
  { size: 512, name: 'my-logo-512-rounded.png' },
  { size: 192, name: 'my-logo-192-rounded.png' },
  { size: 32, name: 'favicon-32x32-rounded.png' }
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
    // generate rounded variants (white background with rounded corners)
    for (const out of outputsWhite) {
      const size = out.size;
      const roundedName = out.name.replace('.png', '-rounded.png');
      const outPath = path.join(iconsDir, roundedName);
      const radius = Math.round(size * 0.16); // 16% radius
      const svgMask = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`;

      // create rounded image: make source resized, mask to rounded shape (transparent corners), then composite over white background
      const resized = await sharp(srcImage).resize(size, size, { fit: 'cover' }).png().toBuffer();
      const roundedBuffer = await sharp(resized)
        .composite([{ input: Buffer.from(svgMask), blend: 'dest-in' }])
        .png()
        .toBuffer();

      // composite over white background
      await sharp({ create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
        .composite([{ input: roundedBuffer, left: 0, top: 0 }])
        .png({ quality: 90 })
        .toFile(outPath);
      console.log('Written', outPath);
    }

    // generate transparent rounded variants (no white background)
    for (const out of outputsTransparent) {
      const size = out.size;
      const roundedName = out.name;
      const outPath = path.join(iconsDir, roundedName);
      const radius = Math.round(size * 0.16); // 16% radius
      const svgMask = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`;

      const resized = await sharp(srcImage).resize(size, size, { fit: 'cover' }).png().toBuffer();
      const roundedBuffer = await sharp(resized)
        .composite([{ input: Buffer.from(svgMask), blend: 'dest-in' }])
        .png()
        .toBuffer();

      // save rounded transparent (no white background)
      await sharp(roundedBuffer).toFile(outPath);
      console.log('Written', outPath);
    }
    // generate maskable icon with an opaque logo-colored background so transparent padding is not rendered black
    const maskPath = path.join(iconsDir, maskableOutput.name);
    const maskableLogo = await sharp(fs.existsSync(cleanedPath) ? cleanedPath : srcImage)
      .resize(420, 420, { fit: 'cover' })
      .png({ quality: 90 })
      .toBuffer();
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 244, g: 234, b: 223, alpha: 1 }
      }
    })
      .composite([{ input: maskableLogo, left: 46, top: 46 }])
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
