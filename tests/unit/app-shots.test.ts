import { readdirSync, statSync } from 'node:fs';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { appShots } from '../../src/config/app-shots';

/**
 * The app's own screens (WEBSITE 18): in colour, as the app shows them, so they are not in the
 * photos test. Each file is light, and its size in the code is its real size, so nothing jumps.
 */
const shots = Object.values(appShots).flatMap((shot) => [shot!.face, ...shot!.pages]);
const phones = readdirSync('public/screens')
  .filter((name) => name.endsWith('.webp'))
  .map((name) => `public/screens/${name}`);

describe('app screens', () => {
  it.each(shots)('$src is the size the code says, and under 120 KB', async (shot) => {
    const file = `public${shot.src}`;
    const { width, height, format } = await sharp(file).metadata();
    expect(format).toBe('webp');
    expect([width, height]).toEqual([shot.width, shot.height]);
    expect(statSync(file).size).toBeLessThan(120 * 1024);
  });

  it('card faces are 16:10, or the report page as paper', () => {
    for (const [id, shot] of Object.entries(appShots)) {
      const ratio = shot!.face.width / shot!.face.height;
      if (shot!.frame === 'paper') expect(id).toBe('parentReport');
      else expect(ratio).toBeCloseTo(1.6, 2);
    }
  });

  it.each(phones)('%s is 780px wide, webp and under 120 KB', async (file) => {
    const { width, format } = await sharp(file).metadata();
    expect(format).toBe('webp');
    expect(width).toBe(780);
    expect(statSync(file).size).toBeLessThan(120 * 1024);
  });

  it('phone pages in dialogs are 780px wide', () => {
    for (const shot of Object.values(appShots)) {
      for (const page of shot!.pages) expect(page.width).toBe(780);
    }
  });

  it('they stay in colour', async () => {
    const { channels } = await sharp('public/screens/coach-calendar.webp').stats();
    expect(Math.abs(channels[0].mean - channels[2].mean)).toBeGreaterThan(3);
  });
});
