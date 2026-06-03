/**
 * Regenerate app icon, Android adaptive icons, and favicon from app-logo.svg.
 * Run: node scripts/generate-brand-assets.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, '../assets/images');
const logoSvg = join(imagesDir, 'app-logo.svg');

const PAPER = '#faf8f5';

function logoPipeline(size) {
  return sharp(logoSvg).resize(size, size, { fit: 'contain' }).png();
}

async function writeLogoPng(path, size) {
  await logoPipeline(size).toFile(path);
  console.log('wrote', path, `${size}x${size}`);
}

async function writeAdaptiveForeground(path, canvas = 1024, logoScale = 0.62) {
  const logoSize = Math.round(canvas * logoScale);
  const logo = await logoPipeline(logoSize).toBuffer();
  const offset = Math.round((canvas - logoSize) / 2);

  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toFile(path);

  console.log('wrote', path);
}

async function writeAdaptiveBackground(path, canvas = 1024) {
  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 3,
      background: PAPER,
    },
  })
    .png()
    .toFile(path);

  console.log('wrote', path);
}

async function writeMonochrome(path, canvas = 1024, logoScale = 0.62) {
  const logoSize = Math.round(canvas * logoScale);
  const logo = await sharp(logoSvg)
    .resize(logoSize, logoSize, { fit: 'contain' })
    .grayscale()
    .png()
    .toBuffer();
  const offset = Math.round((canvas - logoSize) / 2);

  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toFile(path);

  console.log('wrote', path);
}

await writeLogoPng(join(imagesDir, 'app-logo.png'), 1024);
await writeLogoPng(join(imagesDir, 'app-icon.png'), 1024);
await writeAdaptiveForeground(join(imagesDir, 'android-icon-foreground.png'));
await writeAdaptiveBackground(join(imagesDir, 'android-icon-background.png'));
await writeMonochrome(join(imagesDir, 'android-icon-monochrome.png'));
await writeLogoPng(join(imagesDir, 'favicon.png'), 48);