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
  { count }: Sequence,
  { phone, saveData, slow = false }: { phone: boolean; saveData: boolean; slow?: boolean },
) {
  const thinned = (phone || slow) && count >= crossfade.denseFrom ? loading.phoneStride : 1;
  return Math.max(thinned, saveData ? 2 : 1);
}

/**
 * The in-between frames (tier 2) of a set, as positions with a fraction: `factor - 1` between each
 * two of its frames. None when the set has none.
 */
export function betweenList({ count, between }: Sequence) {
  if (!between || between.factor < 2) return [];
  const list: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    for (let k = 1; k < between.factor; k++) list.push(i + k / between.factor);
  }
  return list;
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
 * Moving fast (`speed`, frames per screen frame, above one) the walk passes frames it never shows:
 * it reaches further ahead, the same number of screen frames, and takes only every frame it lands
 * near, so decoding keeps up.
 */
export const wanted = (all: readonly number[], at: number, direction = 0, speed = 0) => {
  const stride = all.length > 1 ? all[1] - all[0] : 1;
  const fast = direction && speed > stride;
  const reach = fast ? Math.max(loading.ahead, Math.ceil(speed * 20)) : loading.ahead;
  // Fast, a frame decoded just behind it still serves: it arrives a screen frame or two late
  const behind = fast ? Math.max(loading.behind, Math.ceil(speed * 3)) : loading.behind;
  const [back, front] = direction ? [behind, reach] : [loading.window, loading.window];
  // Every how many of the list: as many frames as the walk passes in a screen frame
  const every = fast ? Math.floor(speed / stride) : 1;
  return all.filter((i, n) => {
    const d = (i - at) * (direction || 1);
    const near = d >= -back && d <= front && (every === 1 || d <= stride || n % every === 0);
    return near || i % loading.anchorEvery === 0 || i === all[all.length - 1];
  });
};

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
