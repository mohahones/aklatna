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

async function makeTransparentBackground(buffer) {
  const image = sharp(buffer);
  const { width, height } = await image.metadata();
  const raw = await image.ensureAlpha().raw().toBuffer();

  const isBorderBackground = (index) => raw[index] < 120 && raw[index + 1] < 120 && raw[index + 2] < 120;
  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x++) {
    queue.push(x, (height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y++) {
    queue.push(y * width, y * width + width - 1);
  }

  while (queue.length > 0) {
    const pixel = queue.pop();
    if (visited[pixel]) continue;
    visited[pixel] = 1;

    const index = pixel * 4;
    if (!isBorderBackground(index)) continue;
    raw[index + 3] = 0;

    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x > 0) queue.push(pixel - 1);
    if (x < width - 1) queue.push(pixel + 1);
    if (y > 0) queue.push(pixel - width);
    if (y < height - 1) queue.push(pixel + width);
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

    const maskablePath = path.join(iconsDir, 'my-logo-maskable-512.png');
    const maskableLogo = await sharp(cleanedPath)
      .resize(420, 420, { fit: 'cover' })
      .png()
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
      .png()
      .toFile(maskablePath);
    console.log('Written', maskablePath);

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
