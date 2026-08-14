import fs from 'fs';
import path from 'path';
import pngToIco from 'png-to-ico';

const iconsDir = path.resolve(process.cwd(), 'public', 'icons');
const outPath = path.join(iconsDir, 'my-logo.ico');

const candidates = [
  'favicon-32x32-white-rounded.png',
  'my-logo-192-white-rounded.png',
  'my-logo-512-white-rounded.png'
].map(n => path.join(iconsDir, n));

for (const p of candidates) {
  if (!fs.existsSync(p)) {
    console.error('Missing source PNG for ICO:', p);
    process.exit(1);
  }
}

(async () => {
  try {
    const buffer = await pngToIco(candidates);
    fs.writeFileSync(outPath, buffer);
    console.log('Wrote', outPath);
  } catch (err) {
    console.error('Failed to create ICO:', err);
    process.exit(1);
  }
})();
