/**
 * The walk's frame arithmetic, apart from the code that loads and draws them (./walk.ts), so the
 * tests can use it as it is: which frames a screen uses, which to keep decoded, how two blend.
 */
import { crossfade, loading, type Sequence } from '@/config/journey.config';

/**
 * Every how many frames to use: all of them, or every second one of a dense set on a phone
 * (`loading.phoneStride`) and of any set to save data.
 */
export function strideFor(
  { count }: Sequence,
  { phone, saveData }: { phone: boolean; saveData: boolean },
) {
  const onPhone = phone && count >= crossfade.denseFrom ? loading.phoneStride : 1;
  return Math.max(onPhone, saveData ? 2 : 1);
}

/** The frames a set can show at this stride; the last one always, so the walk ends on it. */
export const frameList = ({ count }: Sequence, stride = 1) =>
  Array.from({ length: count }, (_, i) => i).filter((i) => i % stride === 0 || i === count - 1);

/**
 * The frames worth having decoded with the walk at `at` (a frame number): those within
 * `loading.window`, or, while it moves (`direction` 1 or -1), `loading.ahead` in front and
 * `loading.behind` behind; every `loading.anchorEvery`-th one so a jump lands near one; the last.
 */
export const wanted = (all: readonly number[], at: number, direction = 0) => {
  const [back, front] = direction
    ? [loading.behind, loading.ahead]
    : [loading.window, loading.window];
  return all.filter((i) => {
    const d = (i - at) * (direction || 1);
    return (d >= -back && d <= front) || i % loading.anchorEvery === 0 || i === all[all.length - 1];
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
 * The upper one fades in only within `window` of the midpoint between them (0.5: all the way).
 * Two frames more than `gap` apart (a frame between them still loading) never blend: the nearest
 * shows alone, so there is no double image and never a blank.
 */
export function blend(frames: Iterable<number>, at: number, window = 0.5, gap = Infinity) {
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
  const alpha = Math.min(1, Math.max(0, (along - (0.5 - window)) / (2 * window)));
  return { from: below, to: above, alpha };
}
