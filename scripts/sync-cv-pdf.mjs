import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'knowledge', 'cv.pdf');
const dest = join(root, 'public', 'cv.pdf');

if (!existsSync(src)) {
  if (existsSync(dest)) {
    console.log('[sync-cv-pdf] using existing public/cv.pdf');
    process.exit(0);
  }
  console.warn('[sync-cv-pdf] knowledge/cv.pdf not found — CV preview unavailable');
  process.exit(0);
}

copyFileSync(src, dest);
console.log('[sync-cv-pdf] public/cv.pdf updated');
