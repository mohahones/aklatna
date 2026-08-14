import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

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

function avgColorAt(img, width, height, data, x0, y0, w, h) {
  let r = 0, g = 0, b = 0, count = 0;
  for (let y = y0; y < Math.min(y0 + h, height); y++) {
    for (let x = x0; x < Math.min(x0 + w, width); x++) {
      const idx = (y * width + x) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count++;
    }
  }
  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

async function makeTransparentBackground(buffer) {
  const image = sharp(buffer);
  const { width, height } = await image.metadata();
  const raw = await image.ensureAlpha().raw().toBuffer();

  // sample 10x10 blocks at corners
  const sample = 10;
  const tl = avgColorAt(image, width, height, raw, 0, 0, sample, sample);
  const tr = avgColorAt(image, width, height, raw, width - sample, 0, sample, sample);
  const bl = avgColorAt(image, width, height, raw, 0, height - sample, sample, sample);
  const br = avgColorAt(image, width, height, raw, width - sample, height - sample, sample, sample);

  const bg = [Math.round((tl[0] + tr[0] + bl[0] + br[0]) / 4),
              Math.round((tl[1] + tr[1] + bl[1] + br[1]) / 4),
              Math.round((tl[2] + tr[2] + bl[2] + br[2]) / 4)];

  // threshold distance to consider as background
  const thresh = 80; // increased to catch more beige-like backgrounds

  for (let i = 0; i < raw.length; i += 4) {
    const dr = raw[i] - bg[0];
    const dg = raw[i + 1] - bg[1];
    const db = raw[i + 2] - bg[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < thresh) {
      raw[i + 3] = 0; // make transparent
    } else {
      raw[i + 3] = 255;
    }
  }

  return { data: raw, width, height };
}

async function generateAll() {
  try {
    const srcBuffer = await fs.promises.readFile(srcImage);
    const transparent = await makeTransparentBackground(srcBuffer);

    // write a cleaned source used for further generation
    const cleanedPath = path.join(iconsDir, 'my-logo-cleaned.png');
    await sharp(transparent.data, { raw: { width: transparent.width, height: transparent.height, channels: 4 } })
      .png()
      .toFile(cleanedPath);

    const outputs = [
      { size: 512, name: 'my-logo-512.png' },
      { size: 192, name: 'my-logo-192.png' },
      { size: 32, name: 'favicon-32x32.png' }
    ];

    const outputsTransparent = [
      { size: 512, name: 'my-logo-512-rounded.png' },
      { size: 192, name: 'my-logo-192-rounded.png' },
      { size: 32, name: 'favicon-32x32-rounded.png' }
    ];

    for (const out of outputs) {
      const outPath = path.join(iconsDir, out.name);
      await sharp(cleanedPath).resize(out.size, out.size, { fit: 'cover' }).png({ quality: 90 }).toFile(outPath);
      console.log('Written', outPath);
    }

    // rounded transparent
    for (const out of outputsTransparent) {
      const size = out.size;
      const outPath = path.join(iconsDir, out.name);
      const radius = Math.round(size * 0.16);
      const svgMask = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`;

      const resized = await sharp(cleanedPath).resize(size, size, { fit: 'cover' }).png().toBuffer();
      const roundedBuffer = await sharp(resized).composite([{ input: Buffer.from(svgMask), blend: 'dest-in' }]).png().toBuffer();
      await sharp(roundedBuffer).toFile(outPath);
      console.log('Written', outPath);
    }

    // generate ICO from rounded PNGs (32, 192, 512)
    const icoInputs = [
      path.join(iconsDir, 'favicon-32x32-rounded.png'),
      path.join(iconsDir, 'my-logo-192-rounded.png'),
      path.join(iconsDir, 'my-logo-512-rounded.png')
    ];
    const icoOut = path.join(iconsDir, 'my-logo.ico');
    const icoBuffer = await pngToIco(icoInputs);
    await fs.promises.writeFile(icoOut, icoBuffer);
    console.log('Wrote', icoOut);

    console.log('Cleaned icons generated. Please clear browser/app cache and reinstall the PWA.');
  } catch (err) {
    console.error('Error in clean generate:', err);
    process.exit(1);
  }
}

generateAll();
