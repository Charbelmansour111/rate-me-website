import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { frameAt, frameUrl, journey, sceneAt, scenes, stillAt } from '@/config/journey.config';
import { hasFrames } from '@/lib/journey-files';
import { frameList, nearest, shapeFor } from '@/motion/walk';

const { landscape, portrait } = journey;

describe('the walk', () => {
  it('has exactly the frames the config counts', () => {
    expect(hasFrames(landscape)).toBe(true);
    for (const sequence of [landscape, portrait]) {
      const folder = `public${sequence.path.slice(0, sequence.path.lastIndexOf('/'))}`;
      // The portrait set may be missing, but never half there
      if (sequence === portrait && !existsSync(folder)) continue;
      expect(readdirSync(folder), folder).toHaveLength(sequence.count);
      expect(hasFrames(sequence), folder).toBe(true);
    }
  });
  it('falls back to landscape when a sequence is missing or incomplete', () => {
    expect(hasFrames({ ...landscape, path: '/journey/none/f' })).toBe(false);
    expect(hasFrames({ ...landscape, count: landscape.count + 1 })).toBe(false);
  });
  it('takes the portrait set on screens taller than wide, if there is one', () => {
    expect(shapeFor(390, 844, true)).toBe('portrait');
    expect(shapeFor(844, 390, true)).toBe('landscape');
    expect(shapeFor(800, 800, true)).toBe('landscape');
    expect(shapeFor(390, 844, false)).toBe('landscape');
  });
  it('maps the scroll onto the frames, whatever their number', () => {
    for (const count of [48, 31]) {
      const sequence = { ...landscape, count };
      expect([0, 0.5, 1].map((part) => frameAt(sequence, part))).toEqual([
        0,
        Math.round((count - 1) / 2),
        count - 1,
      ]);
    }
    expect(frameUrl(landscape, 7)).toBe('/journey/seq/f007.webp');
  });
  it('has scenes that follow on from 0 to 1', () => {
    let end = 0;
    for (const { from, to } of Object.values(scenes)) {
      expect(from).toBe(end);
      end = to;
    }
    expect(end).toBe(1);
    expect([0, 0.2, 0.9, 1].map(sceneAt)).toEqual(['locker', 'tunnel', 'pitch', 'pitch']);
    for (const [id, at] of Object.entries(stillAt)) {
      const { from, to } = scenes[id as keyof typeof scenes];
      expect(at).toBeGreaterThanOrEqual(from);
      expect(at).toBeLessThanOrEqual(to);
    }
  });
  it('halves the download to save data, and stands in the nearest frame', () => {
    expect(frameList(landscape, false)).toHaveLength(landscape.count);
    expect(frameList(landscape, true)).toHaveLength(Math.ceil(landscape.count / 2));
    expect(nearest([0, 10, 20], 13)).toBe(10);
    expect(nearest([], 3)).toBeUndefined();
  });
});
