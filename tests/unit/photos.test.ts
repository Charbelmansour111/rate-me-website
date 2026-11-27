import { statSync } from 'node:fs';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

/**
 * Every photograph on the site is black and white (WEBSITE 15). The community portraits are
 * turned grey in CSS (src/app/motion.css, .coach-photo img); these are grey in the files
 * themselves. App screenshots stay in colour: they show the app as it is.
 */
const PHOTOS = [
  'public/features/calendar.webp',
  'public/features/whiteboard.webp',
  'public/features/tournaments.webp',
  'public/features/assistant.jpg',
  'public/cards/player.jpg',
  'public/community/players.webp',
  'public/footer/pitch.webp',
];

describe('photos', () => {
  it.each(PHOTOS)('%s is black and white', async (file) => {
    const { channels } = await sharp(file).stats();
    // A grey file: red, green and blue the same, or a single channel
    if (channels.length >= 3) {
      const [r, g, b] = channels;
      expect(Math.abs(r.mean - g.mean)).toBeLessThan(1.5);
      expect(Math.abs(g.mean - b.mean)).toBeLessThan(1.5);
    }
  });

  it.each(PHOTOS)('%s is at most 1600px wide and under 120 KB', async (file) => {
    const { width } = await sharp(file).metadata();
    expect(width).toBeLessThanOrEqual(1600);
    expect(statSync(file).size).toBeLessThan(120 * 1024);
  });
});
