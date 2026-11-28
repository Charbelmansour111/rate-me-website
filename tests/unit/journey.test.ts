import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  crossfade,
  frameAt,
  frameFormat,
  framePath,
  frameUrl,
  heldKey,
  INTRO_SCRIPT,
  journey,
  loading,
  pairWindow,
  sceneAt,
  scenes,
  stillAt,
} from '@/config/journey.config';
import { hasFrames } from '@/lib/journey-files';
import { blend, frameList, nearest, shapeFor, strideFor, wanted } from '@/motion/walk';
import {
  apart,
  betweenList,
  bracket,
  covered,
  merge,
  outward,
  spacingOf,
  tierTwo,
} from '@/motion/walk-frames';
import { halfMotion, pairMotion } from '@/config/walk-pairs';
import { introPack } from '@/config/walk-pack';

const { landscape, portrait } = journey;

describe('the walk', () => {
  it('has exactly the frames the config counts', () => {
    expect(hasFrames(landscape)).toBe(true);
    for (const sequence of [landscape, portrait]) {
      const folder = `public${sequence.path.slice(0, sequence.path.lastIndexOf('/'))}`;
      // The portrait set may be missing, but never half there
      if (sequence === portrait && !existsSync(folder)) continue;
      // Its own format, and AVIF beside it where the set has it (WEBSITE 29)
      const own = readdirSync(folder).filter((name) => name.endsWith(`.${sequence.ext}`));
      expect(own, folder).toHaveLength(sequence.count);
      if (sequence.avif) {
        expect(readdirSync(folder).filter((name) => name.endsWith('.avif'))).toHaveLength(
          sequence.count,
        );
      }
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
    expect(framePath(landscape, 7)).toBe('/journey/seq/f007.webp');
    // The address carries the render, so it can be cached for good
    expect(frameUrl(landscape, 7)).toBe(`/journey/seq/f007.webp?v=${landscape.rev}`);
    // In-between frames (tier 2) are numbered after the frame before them
    const tiered = { ...landscape, between: { path: '/journey/mid/f', factor: 3 } };
    expect(frameUrl(tiered, 7 + 1 / 3)).toBe(`/journey/mid/f007-1.webp?v=${landscape.rev}`);
    expect(frameUrl(tiered, 7 + 2 / 3)).toBe(`/journey/mid/f007-2.webp?v=${landscape.rev}`);
    expect(frameUrl(tiered, 8)).toBe(`/journey/seq/f008.webp?v=${landscape.rev}`);
    // AVIF where the browser decodes it (WEBSITE 29), for a set that has it; WebP otherwise
    frameFormat.avif = true;
    try {
      expect(frameUrl(landscape, 7)).toBe(`/journey/seq/f007.avif?v=${landscape.rev}`);
      expect(frameUrl(landscape, 7.5)).toBe(`/journey/mid/f007-1.avif?v=${landscape.rev}`);
      expect(frameUrl(landscape, 0)).toBe(`/journey/seq/f000.webp?v=${landscape.rev}`);
      expect(frameUrl(journey.portrait, 7)).toMatch(/\.webp\?/);
    } finally {
      frameFormat.avif = false;
    }
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
  it('halves the frames on a phone and to save data, keeping the last', () => {
    const dense = { ...landscape, count: 381 };
    expect(strideFor(dense, { phone: false, saveData: false })).toBe(1);
    expect(strideFor(dense, { phone: true, saveData: false })).toBe(loading.phoneStride);
    expect(strideFor(dense, { phone: false, saveData: true })).toBe(2);
    // Below 4G: the thinned set, as on a phone
    expect(strideFor(dense, { phone: false, saveData: false, slow: true })).toBe(2);
    // A short set is never thinned on a phone: its frames are already far apart
    expect(strideFor({ ...landscape, count: 48 }, { phone: true, saveData: false })).toBe(1);
    expect(frameList(dense)).toHaveLength(381);
    expect(frameList(dense, 2)).toHaveLength(191);
    expect(frameList({ ...dense, count: 382 }, 2).at(-1)).toBe(381);
  });
  it('keeps only the frames round the position decoded, with anchors for a jump', () => {
    const all = frameList({ ...landscape, count: 381 }, 2);
    const kept = wanted(all, 200);
    const near = kept.filter((i) => Math.abs(i - 200) <= loading.window);
    expect(near).toEqual(all.filter((i) => i >= 176 && i <= 224));
    // The far ones: every anchorEvery-th frame and the last, nothing else
    for (const i of kept.filter((i) => Math.abs(i - 200) > loading.window)) {
      expect(i % loading.anchorEvery === 0 || i === 380).toBe(true);
    }
    // Far fewer than the whole set, at the top as anywhere
    expect(wanted(all, 0).length).toBeLessThan(40);
    expect(kept.length).toBeLessThan(all.length / 3);
  });
  it('stands in the nearest frame', () => {
    expect(nearest([0, 10, 20], 13)).toBe(10);
    // A tie goes to the earlier frame, in whatever order the frames came in
    expect(nearest([168, 166], 167)).toBe(166);
    expect(nearest([], 3)).toBeUndefined();
  });
  it('crossfades the two frames either side, by how far along it is', () => {
    const all = frameList(landscape);
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
    expect(blend(frameList(dense), 0.5 * (dense.count - 1))).toEqual({
      from: 59,
      to: 60,
      alpha: 0.5,
    });
  });
  it('blends neighbours by the fraction, like film, and never across a gap', () => {
    // A window of 0.5: the upper frame shows by how far along it is (WEBSITE 17)
    expect(crossfade.window).toBe(0.5);
    expect(blend([10, 11], 10.25, 0.5, 1)!.alpha).toBeCloseTo(0.25);
    expect(blend([10, 12], 11.5, 0.5, 2)!.alpha).toBeCloseTo(0.75);
    // A window of 0: a cut at the midpoint, never two at once
    expect(blend([10, 11], 10.49, 0, 1)!.alpha).toBe(0);
    expect(blend([10, 11], 10.5, 0, 1)!.alpha).toBe(1);
    // Per pair: the window is asked of the two frames either side
    expect(
      blend([10, 11], 10.5, (a, b) => (a === 10 && b === 11 ? 0.1 : 0.5), 1)!.alpha,
    ).toBeCloseTo(0.5);
    expect(blend([10, 11], 10.42, () => 0.1, 1)!.alpha).toBeCloseTo(0.1);
    // A frame still loading between them: the nearest shows alone, no double image, no blank
    expect(blend([10, 14], 11, 0.5, 2)).toEqual({ from: 10, to: 10, alpha: 0 });
    expect(blend([10, 14], 13, 0.5, 2)).toEqual({ from: 14, to: 14, alpha: 0 });
  });
  it('keeps more frames ahead of the walk than behind it while it moves', () => {
    const all = frameList({ ...landscape, count: 381 });
    const { ahead, behind } = loading;
    // Going forward: up to `ahead` in front, `behind` behind (199 and 241 are no anchors)
    const forward = wanted(all, 200, 1);
    expect(forward).toContain(200 + ahead);
    expect(forward).not.toContain(200 + ahead + 1);
    expect(forward).toContain(200 - behind);
    expect(forward).not.toContain(200 - behind - 1);
    // Going back: the other way round
    const back = wanted(all, 200, -1);
    expect(back).toContain(200 - ahead);
    expect(back).not.toContain(200 - ahead - 1);
    expect(back).toContain(200 + behind);
    expect(back).not.toContain(200 + behind + 1);
  });
  it('fades each pair by how far its picture moves: a cut where it moves a lot (WEBSITE 22)', () => {
    // A motion map for every pair of the set, from scripts/walk-pairs.mjs
    expect(pairMotion).toHaveLength(landscape.count - 1);
    const calm = pairMotion.indexOf(Math.min(...pairMotion));
    const far = pairMotion.findIndex((px) => px >= crossfade.cutFrom);
    expect(far).toBeGreaterThanOrEqual(0);
    // Hardly moving (a tenth of the calmest pair): all the way; moving far: a cut; between,
    // narrower the more it moves
    expect(pairWindow(landscape, calm, calm + 0.1)).toBe(0.5);
    expect(pairWindow(landscape, far, far + 1)).toBe(0);
    const mid = pairMotion.findIndex((px) => px > 12 && px < 20);
    const w = pairWindow(landscape, mid, mid + 1);
    expect(w).toBeCloseTo((0.5 * crossfade.soft) / pairMotion[mid]);
    expect(w).toBeLessThan(0.25);
    // Two frames apart (a phone): the motion of both pairs, so a narrower window or a cut
    expect(pairWindow(landscape, mid, mid + 2)).toBeLessThanOrEqual(w);
    // Half a pair (an in-between frame, WEBSITE 23): that half's own measured motion, and the cut
    // from halfCutFrom
    expect(halfMotion).toHaveLength(2 * (landscape.count - 1));
    const h = halfMotion[2 * mid];
    expect(pairWindow(landscape, mid, mid + 0.5)).toBeCloseTo(
      h >= crossfade.halfCutFrom ? 0 : Math.min(0.5, (0.5 * crossfade.soft) / h),
    );
    const sharp = halfMotion.findIndex(
      (px) => px >= crossfade.halfCutFrom && px < crossfade.cutFrom,
    );
    expect(sharp).toBeGreaterThanOrEqual(0);
    const at = sharp / 2;
    expect(pairWindow(landscape, at, at + 0.5)).toBe(0);
    // Each pair, split in two, mostly moves about half as far
    const median = (xs: readonly number[]) => [...xs].sort((a, b) => a - b)[xs.length >> 1];
    expect(median(halfMotion)).toBeLessThanOrEqual(median(pairMotion) / 2 + 1);
    // A set without a map fades all the way (the portrait set, WEBSITE 28, shares the landscape's:
    // the same motion, scaled)
    expect(pairWindow({ ...landscape, count: 48 }, 3, 4)).toBe(0.5);
    expect(journey.portrait.count).toBe(landscape.count);
  });
  it('lets the walk move only where a decoded frame is near', () => {
    expect(covered([10, 11, 12], 12.4, 1)).toBe(true);
    expect(covered([10, 11, 12], 13.5, 1)).toBe(false);
    expect(covered([], 3, 1)).toBe(false);
  });
  it('thins the frames it decodes ahead of a fast walk, and reaches further', () => {
    const all = frameList({ ...landscape, count: 381 });
    const fast = wanted(all, 100, 1, 4).filter(
      (i) => i > 101 && i < 380 && i % loading.anchorEvery !== 0,
    );
    // Every fourth frame, as far as 20 screen frames at that speed
    expect(fast.every((i) => i % 4 === 0)).toBe(true);
    expect(Math.max(...fast)).toBeGreaterThanOrEqual(100 + loading.ahead);
    expect(Math.max(...fast)).toBeLessThanOrEqual(180);
    // At a hand's pace, every frame
    expect(wanted(all, 100, 1, 1)).toEqual(wanted(all, 100, 1));
  });
  it('fetches the whole set in the background from where the walk is, outward', () => {
    expect(outward([0, 1, 2, 3, 4, 5], 3)).toEqual([3, 2, 4, 1, 5, 0]);
    // In-between frames: one in every pair of the landscape set, on file (WEBSITE 23)
    const mids = betweenList(landscape);
    expect(mids).toHaveLength(landscape.count - 1);
    expect(mids.every((at) => at % 1 === 0.5)).toBe(true);
    for (const ext of ['webp', 'avif']) {
      const files = readdirSync('public/journey/mid').filter((name) => name.endsWith(`.${ext}`));
      expect(files, ext).toHaveLength(mids.length);
    }
    expect(readdirSync('public/journey/seq').filter((name) => name.endsWith('.avif'))).toHaveLength(
      landscape.count,
    );
    for (const at of mids.slice(0, 3)) {
      const file = frameUrl(landscape, at).split('?')[0];
      expect(existsSync(`public${file}`), file).toBe(true);
    }
    // A pair skipped for an artefact keeps its real frames
    const tiered = { ...landscape, count: 4, between: { path: '/x/f', factor: 2, skip: [1] } };
    expect(betweenList(tiered)).toEqual([0.5, 2.5]);
    expect(betweenList({ ...landscape, between: undefined })).toEqual([]);
  });
  it('tier 2: the in-between frames on a wide screen, the skipped real frames on a phone', () => {
    expect(tierTwo(landscape, 1, false)).toEqual(betweenList(landscape));
    const phone = tierTwo(landscape, 2, true);
    expect(phone).toHaveLength(190);
    expect(phone.every((i) => i % 2 === 1)).toBe(true);
    // A set already thinned another way (saving data on a computer) gets none
    expect(tierTwo(landscape, 2, false)).toEqual([]);
  });
  it('never blends across a frame of the set, and narrows the decoded window where tier 2 is in', () => {
    const all = merge([0, 1, 2, 3], [0.5, 2.5]);
    expect(all).toEqual([0, 0.5, 1, 2, 2.5, 3]);
    expect(apart(all, 0, 1)).toBe(true);
    expect(apart(all, 1, 2)).toBe(false);
    expect(apart(all, 0.5, 1)).toBe(false);
    // The frames either side of a position: the walk moves only where both are decoded
    expect(bracket(all, 0.75)).toEqual([0.5, 1]);
    expect(bracket(all, 2)).toEqual([2, 2]);
    expect(bracket(all, 3.5)).toEqual([3, undefined]);
    expect(spacingOf(frameList(landscape))).toBe(1);
    const dense = merge(frameList(landscape), betweenList(landscape));
    expect(spacingOf(dense)).toBe(0.5);
    // About as many decoded with tier 2 in as without (2 MB each: about 150 MB at most)
    const plain = wanted(frameList(landscape), 200, 1).length;
    const tiered = wanted(dense, 200, 1, 0, 0.5).length;
    expect(tiered).toBeLessThanOrEqual(plain + 2);
    expect(Math.max(plain, tiered) * ((960 * 540 * 4) / 1e6)).toBeLessThanOrEqual(150);
  });
});

describe("the first visit's intro (WEBSITE 25)", () => {
  it('fetches every introEvery-th frame and the last, as one file, in order', () => {
    expect(introPack.every).toBe(loading.introEvery);
    const last = landscape.count - 1;
    const want = frameList(landscape).filter((i) => i % loading.introEvery === 0 || i === last);
    expect(introPack.frames).toEqual(want);
    expect(introPack.sizes).toHaveLength(want.length);
  });

  it("holds exactly the frames' bytes, end to end (run scripts/walk-pack.mjs after a render)", () => {
    const file = readFileSync(`public${introPack.path}`);
    let at = 0;
    introPack.frames.forEach((frame, n) => {
      const own = readFileSync(`public${framePath(landscape, frame)}`);
      expect(introPack.sizes[n]).toBe(own.length);
      expect(file.subarray(at, at + own.length).equals(own)).toBe(true);
      at += own.length;
    });
    expect(statSync(`public${introPack.path}`).size).toBe(at);
    // And its AVIF twin, from the files the walk asks for in AVIF (WEBSITE 29: the first frame, which
    // the page preloads, stays WebP)
    const avif = readFileSync(`public${introPack.avifPath}`);
    at = 0;
    frameFormat.avif = true;
    try {
      introPack.frames.forEach((frame, n) => {
        const own = readFileSync(`public${frameUrl(landscape, frame).split('?')[0]}`);
        expect(introPack.avifSizes[n]).toBe(own.length);
        expect(avif.subarray(at, at + own.length).equals(own)).toBe(true);
        at += own.length;
      });
    } finally {
      frameFormat.avif = false;
    }
    expect(avif.length).toBe(at);
  });

  it('is decided before the first paint by the same key the walk notes', () => {
    // The script reads the key the walk writes (src/motion/walk.ts, remember)
    expect(INTRO_SCRIPT).toContain(JSON.stringify(heldKey(landscape, 0).slice(0, -1)));
    expect(INTRO_SCRIPT).toContain('prefers-reduced-motion: reduce');
    expect(INTRO_SCRIPT).toContain('saveData');
    expect(INTRO_SCRIPT).toContain(`innerWidth<${loading.phoneWidth}`);
  });

  it("gives the phone's set the same frames, since its stride divides introEvery", () => {
    expect(loading.introEvery % loading.phoneStride).toBe(0);
    const phone = new Set(frameList(landscape, loading.phoneStride));
    for (const frame of introPack.frames) expect(phone.has(frame)).toBe(true);
  });

  it('runs the script without error, and opens only when nothing is noted', () => {
    const run = (stored: Record<string, string>, width: number, reduce = false) => {
      const root = { dataset: {} as Record<string, string> };
      const held = new Set<string>();
      const win: { __introRelease?: () => void } = {};
      const env = {
        document: { documentElement: root },
        navigator: {},
        innerWidth: width,
        matchMedia: () => ({ matches: reduce }),
        localStorage: { getItem: (key: string) => stored[key] ?? null },
        window: win,
        setTimeout: () => 0,
        addEventListener: (type: string, _: unknown, o: AddEventListenerOptions) => {
          expect(o).toMatchObject({ capture: true, passive: false });
          held.add(type);
        },
        removeEventListener: (type: string) => held.delete(type),
      };
      new Function(...Object.keys(env), INTRO_SCRIPT)(...Object.values(env));
      // Open: the page is held still until the motion code lets go
      if (root.dataset.walkGate === 'open') {
        expect([...held].sort()).toEqual(['keydown', 'touchmove', 'wheel']);
        win.__introRelease!();
        expect(held.size).toBe(0);
      } else expect(held.size).toBe(0);
      return root.dataset.walkGate;
    };
    expect(run({}, 1440)).toBe('open');
    expect(run({ [heldKey(landscape, 1)]: '1' }, 1440)).toBeUndefined();
    // A phone: never an intro, its walk is a drawing (WEBSITE 27)
    expect(run({}, 390)).toBeUndefined();
    expect(run({ [heldKey(landscape, 1)]: '1' }, 390)).toBeUndefined();
    expect(run({}, 1440, true)).toBeUndefined();
  });
});

describe('decoded memory (WEBSITE 25)', () => {
  it('holds at most 150 MB of decoded frames, and room for what the walk keeps', () => {
    const frameMB = (960 * 540 * 4) / 1e6;
    expect(loading.maxDecoded * frameMB).toBeLessThanOrEqual(150);
    // The window the walk keeps fits under the ceiling, tier 2 in or not
    const dense = frameList(landscape).flatMap((i) => (i < 380 ? [i, i + 0.5] : [i]));
    expect(wanted(frameList(landscape), 200, 1).length).toBeLessThanOrEqual(loading.maxDecoded);
    expect(wanted(dense, 200, 1, 0, 0.5).length).toBeLessThanOrEqual(loading.maxDecoded);
  });
});
