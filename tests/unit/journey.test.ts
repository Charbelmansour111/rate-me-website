import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { frameAt, frameUrl, journey, sceneAt, scenes, stillFrame } from '@/config/journey.config';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';
import { frameList, nearest } from '@/motion/walk';

describe('the walk', () => {
  it('has exactly the frames the config counts', () => {
    const files = Array.from({ length: journey.count }, (_, i) => frameUrl(i));
    for (const file of files) expect(existsSync(`public${file}`), file).toBe(true);
    expect(readdirSync('public/journey/seq')).toHaveLength(journey.count);
  });
  it('maps the scroll onto the frames', () => {
    expect([0, 0.5, 1].map(frameAt)).toEqual([
      0,
      Math.round((journey.count - 1) / 2),
      journey.count - 1,
    ]);
  });
  it('has scenes that follow on from 0 to 1, labelled in both languages', () => {
    let end = 0;
    for (const { from, to } of Object.values(scenes)) {
      expect(from).toBe(end);
      end = to;
    }
    expect(end).toBe(1);
    expect([0, 0.2, 0.9, 1].map(sceneAt)).toEqual(['locker', 'tunnel', 'pitch', 'pitch']);
    for (const { journey: labels } of [en, ar]) {
      expect(Object.keys(labels)).toEqual(Object.keys(scenes));
    }
    for (const frame of Object.values(stillFrame)) expect(frame).toBeLessThan(journey.count);
  });
  it('halves the download to save data, and stands in the nearest frame', () => {
    expect(frameList(false)).toHaveLength(journey.count);
    expect(frameList(true)).toHaveLength(Math.ceil(journey.count / 2));
    expect(nearest([0, 10, 20], 13)).toBe(10);
    expect(nearest([], 3)).toBeUndefined();
  });
});
