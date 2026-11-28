// The landscape walk in AVIF as well as WebP (WEBSITE 29): about 45% fewer bytes for the same
// picture, so a first visit has its frames sooner. Every frame of public/journey/seq (tier 1) at
// quality 55, every in-between of public/journey/mid (tier 2, always blended, so softer) at 45, next
// to their WebP files; browsers without AVIF keep the WebP ones. Run after a new render:
//   node scripts/walk-avif.mjs
import { readdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const sets = [
  { dir: 'public/journey/seq', quality: 55 },
  { dir: 'public/journey/mid', quality: 45 },
];
for (const { dir, quality } of sets) {
  let bytes = 0;
  const files = readdirSync(dir).filter((name) => name.endsWith('.webp'));
  for (const name of files) {
    // Chroma at 4:2:0, as WebP's always is: no colour lost against the WebP set, and about 15% less
    // time to decode than sharp's default 4:4:4 (which the walk felt on a busy processor)
    const avif = await sharp(`${dir}/${name}`)
      .avif({ quality, effort: 5, chromaSubsampling: '4:2:0' })
      .toBuffer();
    writeFileSync(`${dir}/${name.replace(/\.webp$/, '.avif')}`, avif);
    bytes += avif.length;
  }
  console.log(`${dir}: ${files.length} frames, ${(bytes / 1e6).toFixed(1)} MB`);
}
