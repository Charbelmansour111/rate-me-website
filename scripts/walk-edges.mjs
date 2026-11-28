// On a phone the walk plays in a 16:9 window (WEBSITE 25); the ground above and below it takes the
// colour of the frame's own top and bottom edges, darkened, so the window sits in its own light.
// Worked out here once per frame, not read back from the canvas as it plays. Writes
// src/config/walk-edges.ts. Run after a new render:
//   node scripts/walk-edges.mjs
import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

/** How much of the edge colour shows over the brand black: dark, but its own. */
const TINT = 0.32;
const BLACK = [11, 11, 12];
const ROWS = 6;

const names = readdirSync('public/journey/seq')
  .filter((name) => /^f\d+\.webp$/.test(name))
  .sort();
const hex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const tint = (rgb) => rgb.map((v, i) => BLACK[i] + (v - BLACK[i]) * TINT);

const top = [];
const bottom = [];
for (const name of names) {
  const { data, info } = await sharp(`public/journey/seq/${name}`)
    .resize(96, 54)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mean = (y0, y1) => {
    const sum = [0, 0, 0];
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < info.width; x++) {
        for (let c = 0; c < 3; c++) sum[c] += data[(y * info.width + x) * 3 + c];
      }
    }
    return sum.map((v) => v / ((y1 - y0) * info.width));
  };
  top.push(hex(tint(mean(0, ROWS))));
  bottom.push(hex(tint(mean(info.height - ROWS, info.height))));
}

const lines = [
  '// Written by scripts/walk-edges.mjs: do not edit by hand.',
  '/**',
  " * The ground round the walk's window on a phone, per frame of the landscape set: the colour of",
  ' * its top and bottom edges, darkened (src/motion/walk.ts).',
  ' */',
  `export const edgeTop = ${JSON.stringify(top)};`,
  `export const edgeBottom = ${JSON.stringify(bottom)};`,
  '',
];
writeFileSync('src/config/walk-edges.ts', lines.join('\n'));
execSync('npx prettier --write src/config/walk-edges.ts', { stdio: 'ignore' });
console.log(`${names.length} frames`);
