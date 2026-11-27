// How far the picture moves between each two neighbouring frames of the walk, for the crossfade
// (src/config/walk-pairs.ts, WEBSITE 22). Two frames taken from camera positions far apart, blended,
// show every edge twice: those pairs cut instead of fading. Run after a new render:
//   node scripts/walk-pairs.mjs
// Each frame is shrunk to 240 px wide and cut into 15 px blocks; for every block with some texture
// the best match in the next frame is searched within 12 px (48 px at 960). The number kept per pair
// is the 90th percentile of how far the blocks moved, in pixels of the 960 px frame.
import { readdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

// The landscape set (src/config/journey.config.ts): every fNNN file, in order
const path = '/journey/seq/f';
const names = readdirSync('public/journey/seq')
  .filter((name) => /^f\d+\.webp$/.test(name))
  .sort();
const count = names.length;
const W = 240;
const H = 135;
const B = 15;
const R = 12;
const scale = 960 / W;

const file = (i) => `public/journey/seq/${names[i]}`;
const frames = [];
for (let i = 0; i < count; i++) {
  frames.push(await sharp(file(i)).resize(W, H).greyscale().raw().toBuffer());
}

function motion(a, b) {
  const moves = [];
  for (let by = R; by + B <= H - R; by += B) {
    for (let bx = R; bx + B <= W - R; bx += B) {
      let mean = 0;
      for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) mean += a[(by + y) * W + bx + x];
      mean /= B * B;
      let spread = 0;
      for (let y = 0; y < B; y++) {
        for (let x = 0; x < B; x++) spread += (a[(by + y) * W + bx + x] - mean) ** 2;
      }
      // A flat block (a wall, the sky) shows no double image whatever moves
      if (Math.sqrt(spread / (B * B)) < 12) continue;
      let best = Infinity;
      let move = 0;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          let sum = 0;
          for (let y = 0; y < B && sum < best; y++) {
            const ra = (by + y) * W + bx;
            const rb = (by + y + dy) * W + bx + dx;
            for (let x = 0; x < B; x++) sum += Math.abs(a[ra + x] - b[rb + x]);
          }
          const d = Math.hypot(dx, dy);
          if (sum < best || (sum === best && d < move)) [best, move] = [sum, d];
        }
      }
      moves.push(move * scale);
    }
  }
  moves.sort((x, y) => x - y);
  return moves.length ? Math.round(moves[Math.floor(moves.length * 0.9)]) : 0;
}

const pairs = [];
for (let i = 0; i < count - 1; i++) pairs.push(motion(frames[i], frames[i + 1]));

const rows = [];
for (let i = 0; i < pairs.length; i += 20) rows.push(`  ${pairs.slice(i, i + 20).join(', ')},`);
writeFileSync(
  'src/config/walk-pairs.ts',
  `/**
 * How far the picture moves from each frame of the walk to the next (entry i: frame i to i + 1), in
 * pixels of the 960 px frame: the 90th percentile over the parts of the frame with detail in them.
 * Written by scripts/walk-pairs.mjs from public${path}*; run it again after a new render. The
 * crossfade reads it (src/config/journey.config.ts, \`pairWindow\`).
 */
export const pairMotion: readonly number[] = [
${rows.join('\n')}
];
`,
);
const sorted = [...pairs].sort((x, y) => x - y);
console.log(
  `${pairs.length} pairs; median ${sorted[Math.floor(sorted.length / 2)]} px, 90th ${sorted[Math.floor(sorted.length * 0.9)]} px, max ${sorted.at(-1)} px`,
);
