import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { frameAt, frameUrl, journey, sceneAt, scenes, stillAt } from '@/config/journey.config';
import { hasFrames } from '@/lib/journey-files';
import { blend, damp, frameList, nearest, shapeFor } from '@/motion/walk';

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
  it('crossfades the two frames either side, by how far along it is', () => {
    const all = frameList(landscape, false);
    expect(blend(all, 12.25)).toEqual({ from: 12, to: 13, alpha: 0.25 });
    expect(blend(all, 12)).toEqual({ from: 12, to: 12, alpha: 0 });
    expect(blend(all, landscape.count - 1)).toEqual({
      from: landscape.count - 1,
      to: landscape.count - 1,
      alpha: 0,
    });
    // Saving data, or still loading: across the gap, between the frames that are there
    expect(blend([0, 2, 4], 3)).toEqual({ from: 2, to: 4, alpha: 0.5 });
    expect(blend([4, 8], 2)).toEqual({ from: 4, to: 4, alpha: 0 });
    expect(blend([], 2)).toBeUndefined();
    // A denser set needs nothing but its count
    const dense = { ...landscape, count: 120 };
    expect(blend(frameList(dense, false), 0.5 * (dense.count - 1))).toEqual({
      from: 59,
      to: 60,
      alpha: 0.5,
    });
  });
  it('eases towards the scroll at the same pace at any frame rate', () => {
    expect(damp(0, 1, 1000 / 60)).toBeCloseTo(0.1);
    // Two steps at 60 per second land where one at 30 per second does
    expect(damp(damp(0, 1, 1000 / 60), 1, 1000 / 60)).toBeCloseTo(damp(0, 1, 1000 / 30));
    expect(damp(0.4, 0.4, 16)).toBe(0.4);
  });
});
