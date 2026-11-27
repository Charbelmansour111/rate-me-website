// The first visit's intro waits for every `introEvery`-th frame of the walk (src/motion/walk-gate.ts,
// WEBSITE 25). Fetched one by one, a connection with some latency (4G: about 150 ms) spends most of
// its time waiting between them; as one file it goes at the connection's full speed. This writes
// those frames, end to end, to public/journey/pack/ and their sizes, in the same order, to
// src/config/walk-pack.ts. Run after a new render (with the same `rev`) or a change of introEvery:
//   node scripts/walk-pack.mjs
import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const EVERY = 6;
const names = readdirSync('public/journey/seq')
  .filter((name) => /^f\d+\.webp$/.test(name))
  .sort();
const last = names.length - 1;
const frames = names.map((_, i) => i).filter((i) => i % EVERY === 0 || i === last);
const parts = frames.map((i) => readFileSync(`public/journey/seq/${names[i]}`));

rmSync('public/journey/pack', { recursive: true, force: true });
mkdirSync('public/journey/pack', { recursive: true });
const file = `thin-${EVERY}.bin`;
writeFileSync(`public/journey/pack/${file}`, Buffer.concat(parts));

const lines = [
  '// Written by scripts/walk-pack.mjs: do not edit by hand.',
  '/**',
  " * The intro's frames as one file (src/motion/walk-gate.ts): the frames of the landscape set in",
  ' * `frames`, end to end, each `sizes` bytes long, in that order.',
  ' */',
  'export const introPack = {',
  `  path: '/journey/pack/${file}',`,
  `  every: ${EVERY},`,
  `  frames: [${frames.join(', ')}],`,
  `  sizes: [${parts.map((part) => part.length).join(', ')}],`,
  '};',
  '',
];
writeFileSync('src/config/walk-pack.ts', lines.join('\n'));
execSync('npx prettier --write src/config/walk-pack.ts', { stdio: 'ignore' });
const total = parts.reduce((sum, part) => sum + part.length, 0);
console.log(`${frames.length} frames, ${(total / 1e6).toFixed(2)} MB`);
