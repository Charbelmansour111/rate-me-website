import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { stageRanges, stageFrames } from '@/config/journey.config';
import { barGround, blend, STAGES, stageAt, stageColors, stageCss, worstOn } from '@/config/stages';
import { contrast } from '@/lib/color';

const css = readFileSync('src/app/palette.css', 'utf8');

describe('stages follow the walk', () => {
  it('locker room, tunnel, field at 0.22 and 0.59', () => {
    expect(stageRanges.locker).toEqual({ from: 0, to: 0.22 });
    expect(stageRanges.tunnel).toEqual({ from: 0.22, to: 0.59 });
    expect(stageRanges.field).toEqual({ from: 0.59, to: 1 });
  });
  it('the stage frames follow the frame count', () => {
    expect(stageFrames(381)).toEqual({ locker: 0, tunnel: 84, field: 224 });
    expect(stageFrames(191)).toEqual({ locker: 0, tunnel: 42, field: 112 });
  });
  it('each stage holds its own colours away from the boundaries, and blends across them', () => {
    expect(stageAt(0)).toEqual(stageColors.locker);
    expect(stageAt(0.4)).toEqual(stageColors.tunnel);
    expect(stageAt(1)).toEqual(stageColors.field);
    // Half way across a boundary: neither stage
    expect(stageAt(0.22).surface).not.toBe(stageColors.locker.surface);
    expect(stageAt(0.22).surface).not.toBe(stageColors.tunnel.surface);
  });
  it('the CSS in palette.css is the same as the colours here', () => {
    expect(css.replace(/\r/g, '')).toContain(stageCss());
  });
});

describe.each(STAGES)('stage colours: %s', (id) => {
  const s = stageColors[id];
  it('text, muted, small orange and error text are AA on every ground', () => {
    for (const fg of [s.text, s.muted, s.accentText, s.danger]) {
      expect(worstOn(s, fg), fg).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('outlines of fields and large orange text reach 3:1', () => {
    expect(worstOn(s, s.edge)).toBeGreaterThanOrEqual(3);
    expect(worstOn(s, s.accent)).toBeGreaterThanOrEqual(3);
  });
  it('the orange button stays orange with black text', () => {
    expect(contrast('#0b0b0c', '#ff5a00')).toBeGreaterThanOrEqual(4.5);
  });
  it('the header over the photo: AA over a black and a white pixel', () => {
    for (const under of ['#000000', '#ffffff']) {
      expect(contrast(s.text, barGround(s, under)), under).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('every in-between mix stays AA', () => {
  const pairs = STAGES.slice(1).map((b, i) => [STAGES[i], b] as const);
  it.each(pairs)('%s to %s, in 100 steps', (a, b) => {
    for (let k = 0; k <= 100; k++) {
      const s = blend(stageColors[a], stageColors[b], k / 100);
      for (const fg of [s.text, s.muted, s.accentText, s.danger]) {
        expect(worstOn(s, fg), `${k}% ${fg}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(worstOn(s, s.edge), `${k}% edge`).toBeGreaterThanOrEqual(3);
      expect(worstOn(s, s.accent), `${k}% accent`).toBeGreaterThanOrEqual(3);
    }
  });
  it('along the whole walk, in 500 steps', () => {
    for (let k = 0; k <= 500; k++) {
      const s = stageAt(k / 500);
      expect(worstOn(s, s.text)).toBeGreaterThanOrEqual(4.5);
      expect(worstOn(s, s.muted)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
