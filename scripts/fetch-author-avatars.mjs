/**
 * Download author photos and save grayscale PNGs for the app bundle.
 * Run: node scripts/fetch-author-avatars.mjs
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../assets/images/authors');

const SOURCES = [
  {
    id: 'noah-zender',
    url: 'https://pbs.twimg.com/profile_images/1749894223543832576/pPPu4jBC_400x400.jpg',
  },
  {
    id: 'paul-graham',
    url: 'https://s.turbifycdn.com/aah/paulgraham/bio-19.gif',
  },
  {
    id: 'dan-koe',
    url: 'https://pbs.twimg.com/profile_images/1845856303174037504/Q7ZZqVFa_400x400.jpg',
  },
];

mkdirSync(outDir, { recursive: true });

for (const { id, url } of SOURCES) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'read-app-avatar-fetch/1.0' },
  });

  if (!res.ok) {
    throw new Error(`${id}: HTTP ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const outPath = join(outDir, `${id}.png`);

  await sharp(buffer)
    .rotate()
    .resize(360, 480, { fit: 'cover', position: 'centre' })
    .grayscale()
    .normalize()
    .png()
    .toFile(outPath);

  console.log('wrote', outPath);
}