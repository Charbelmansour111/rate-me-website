/**
 * The walk's frame arithmetic, apart from the code that loads and draws them (./walk.ts), so the
 * tests can use it as it is: which frames a screen uses, which to keep decoded, how two blend.
 */
import { crossfade, loading, type Sequence } from '@/config/journey.config';

/**
 * Every how many frames to use: all of them, or every second one of a dense set on a phone
 * (`loading.phoneStride`), on a slow connection (below 4G) and of any set to save data.
 */
export function strideFor(
  { count, full }: Sequence,
  { phone, saveData, slow = false }: { phone: boolean; saveData: boolean; slow?: boolean },
) {
  // A set made for the phone (WEBSITE 28) is used whole there; thinned only when slow
  const thinned =
    ((phone && !full) || slow) && count >= crossfade.denseFrom ? loading.phoneStride : 1;
  return Math.max(thinned, saveData ? 2 : 1);
}

/**
 * The in-between frames of a set, as positions with a fraction: `factor - 1` between each two of
 * its frames, but for the pairs in `skip` (an in-between dropped for an artefact: the real
 * neighbours stand in). None when the set has none.
 */
export function betweenList({ count, between }: Sequence) {
  if (!between || between.factor < 2) return [];
  const skip = new Set(between.skip ?? []);
  const list: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    if (skip.has(i)) continue;
    for (let k = 1; k < between.factor; k++) list.push(i + k / between.factor);
  }
  return list;
}

/**
 * Tier 2, fetched after the set in use is held, on a good connection (4G, not saving data): on a
 * wide screen and for a set made for the phone the in-between frames; on a phone with a thinned
 * set, the real frames it skips.
 */
export function tierTwo(sequence: Sequence, stride: number, phone: boolean) {
  if (phone && stride > 1) {
    const used = new Set(frameList(sequence, stride));
    return frameList(sequence, 1).filter((i) => !used.has(i));
  }
  return stride === 1 ? betweenList(sequence) : [];
}

/** The frames in the order to fetch them in the background: from `at` outward, both ways. */
export function outward(list: readonly number[], at: number) {
  return [...list].sort((a, b) => Math.abs(a - at) - Math.abs(b - at) || a - b);
}

/** The frames a set can show at this stride; the last one always, so the walk ends on it. */
export const frameList = ({ count }: Sequence, stride = 1) =>
  Array.from({ length: count }, (_, i) => i).filter((i) => i % stride === 0 || i === count - 1);

/**
 * The frames worth having decoded with the walk at `at` (a frame number): those within
 * `loading.window`, or, while it moves (`direction` 1 or -1), `loading.ahead` in front and
 * `loading.behind` behind; every `loading.anchorEvery`-th one so a jump lands near one; the last.
 * Fast (`speed`, frames per screen frame, above two) the walk passes frames it never shows: it reaches further ahead, the same number of screen frames, and takes only every
 * frame it lands near, so decoding keeps up. `scale` narrows the reach where the list is denser than
 * its set's stride (tier 2 in), so about as many frames stay decoded (WEBSITE 23: memory).
 */
export const wanted = (all: readonly number[], at: number, direction = 0, speed = 0, scale = 1) => {
  const stride = spacingOf(all);
  // Faster than two frames a screen frame (a fast scroll): it reaches further, thinned
  const fast = direction && speed > Math.max(2, stride);
  const ahead = loading.ahead * scale;
  const reach = fast ? Math.max(ahead, Math.ceil(speed * 20)) : ahead;
  // Fast, a frame decoded just behind it still serves: it arrives a screen frame or two late
  const behind = fast
    ? Math.max(loading.behind * scale, Math.ceil(speed * 3))
    : loading.behind * scale;
  const around = loading.window * scale;
  const [back, front] = direction ? [behind, reach] : [around, around];
  // Every how many of the list: as many frames as the walk passes in a screen frame
  const every = fast ? Math.floor(speed / stride) : 1;
  return all.filter((i, n) => {
    const d = (i - at) * (direction || 1);
    const near = d >= -back && d <= front && (every === 1 || d <= stride || n % every === 0);
    return near || i % loading.anchorEvery === 0 || i === all[all.length - 1];
  });
};

/** The average distance between two frames of a list (1 for every frame, 0.5 with tier 2 in). */
export const spacingOf = (all: readonly number[]) =>
  all.length > 1 ? (all[all.length - 1] - all[0]) / (all.length - 1) : 1;

/**
 * Whether a frame of the list lies strictly between `a` and `b` (sorted list): then the two are no
 * neighbours, and are never blended across it, decoded or not.
 */
export function apart(all: readonly number[], a: number, b: number) {
  let lo = 0;
  let hi = all.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (all[mid] <= a) lo = mid + 1;
    else hi = mid;
  }
  return lo < all.length && all[lo] < b;
}

/** The frames of a sorted list either side of `x` (the same one twice when `x` is on it). */
export function bracket(
  all: readonly number[],
  x: number,
): [number | undefined, number | undefined] {
  let lo = 0;
  let hi = all.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (all[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  // all[lo] is the first at or past x
  if (all[lo] === x) return [x, x];
  return [all[lo - 1], all[lo]];
}

/** Two sorted lists as one, sorted. */
export function merge(a: readonly number[], b: readonly number[]) {
  const out: number[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (j >= b.length || (i < a.length && a[i] <= b[j])) out.push(a[i++]);
    else out.push(b[j++]);
  }
  return out;
}

/** The one closest to `frame`; the earlier one when two are as close. */
export const nearest = (frames: Iterable<number>, frame: number) => {
  let best: number | undefined;
  for (const i of frames) {
    const [d, b] = [Math.abs(i - frame), best === undefined ? Infinity : Math.abs(best - frame)];
    // Whatever order they come in (they load nearest first), the earlier one wins a tie
    if (best === undefined || d < b || (d === b && i < best)) best = i;
  }
  return best;
};

/**
 * The two loaded frames either side of `at` (a frame number with a fraction, 0 to count - 1) and
 * how much of the upper one shows. One frame alone when `at` is on it or past the loaded ones.
 * The upper one fades in only within `window` of the midpoint between them (0.5: all the way; 0: a
 * cut at the midpoint), a number or, per pair, a function of the two. Two frames more than `gap`
 * apart (a frame between them still loading) never blend: the nearest shows alone, so there is no
 * double image and never a blank.
 */
export function blend(
  frames: Iterable<number>,
  at: number,
  window: number | ((from: number, to: number) => number) = 0.5,
  gap = Infinity,
) {
  let below: number | undefined;
  let above: number | undefined;
  for (const i of frames) {
    if (i <= at && (below === undefined || i > below)) below = i;
    if (i >= at && (above === undefined || i < above)) above = i;
  }
  if (below === undefined || above === undefined || below === above) {
    const only = below ?? above;
    return only === undefined ? undefined : { from: only, to: only, alpha: 0 };
  }
  if (above - below > gap) {
    const only = at - below <= above - at ? below : above;
    return { from: only, to: only, alpha: 0 };
  }
  const along = (at - below) / (above - below);
  const w = typeof window === 'number' ? window : window(below, above);
  const alpha =
    w <= 0 ? Number(along >= 0.5) : Math.min(1, Math.max(0, (along - (0.5 - w)) / (2 * w)));
  return { from: below, to: above, alpha };
}

/**
 * Whether a decoded frame is within `reach` frames of `at`: what the walk may move to without the
 * picture jumping across a gap.
 */
export function covered(frames: Iterable<number>, at: number, reach: number) {
  for (const i of frames) if (Math.abs(i - at) <= reach) return true;
  return false;
}
