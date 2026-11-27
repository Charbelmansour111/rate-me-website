import { readdirSync, statSync } from 'node:fs';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { photos } from '../../src/config/photos';

/**
 * The colour rule, from src/config/photos.ts: a photo with a visible face is black and white in
 * the file itself (WEBSITE 17); one with no face is whatever its tone says (the feature cards are
 * all grey, WEBSITE 19), and the file must match it. App screens are not in the list
 * (tests/unit/app-shots.test.ts).
 */

/** How colourful a picture is: the mean, over its pixels, of the gap between its channels. */
async function colourfulness(file: string) {
  const { data, info } = await sharp(file)
    .resize(64, 64, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (info.channels < 3) return 0;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    sum += Math.max(r, g, b) - Math.min(r, g, b);
  }
  return sum / (data.length / info.channels);
}

describe('photos', () => {
  it.each(photos.filter((p) => p.faces))('$file shows a face: its tone is grey', ({ tone }) => {
    expect(tone).toBe('grey');
  });

  it.each(photos.filter((p) => p.tone === 'grey'))('$file is black and white', async ({ file }) => {
    expect(await colourfulness(file)).toBeLessThan(2);
  });

  it.each(photos.filter((p) => p.tone === 'colour'))('$file is in colour', async ({ file }) => {
    expect(await colourfulness(file)).toBeGreaterThan(8);
  });

  it.each(photos)('$file is at most 1600px wide and under 120 KB', async ({ file }) => {
    const { width } = await sharp(file).metadata();
    expect(width).toBeLessThanOrEqual(1600);
    expect(statSync(file).size).toBeLessThan(120 * 1024);
  });

  it('lists every photograph in public/', () => {
    const listed = new Set(photos.map((p) => p.file));
    const folders = ['public/community', 'public/cards', 'public/footer', 'public/features'];
    // The app's own screens (src/config/app-shots.ts), not photos
    const app = /^(squad|parentReport)|-detail/;
    for (const folder of folders) {
      for (const name of readdirSync(folder)) {
        const file = `${folder}/${name}`;
        if (!/\.(jpe?g|webp|avif|png)$/.test(name) || app.test(name)) continue;
        expect(listed.has(file), file).toBe(true);
      }
    }
  });
});
