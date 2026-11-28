import { halfMotion, pairMotion } from './walk-pairs';

/**
 * The walk behind the home page: numbered images, drawn by the scroll. `portrait` is used where the
 * screen is taller than wide, once all its files are there; until then `landscape` is used
 * everywhere. For a new render, replace the files, change `count` and raise `rev` (the frames are
 * cached for good under their address, which carries it), then run scripts/walk-pairs.mjs.
 *
 * `between`: in-between frames for wide screens on a good connection (tier 2, WEBSITE 23), `factor -
 * 1` of them between each two frames, numbered `fNNN-k`. They are fetched once the frames themselves
 * are held and used as they arrive; a pair in `skip` has none.
 */
export type Sequence = {
  path: string;
  count: number;
  ext: string;
  pad: number;
  rev: number;
  between?: { path: string; factor: number; skip?: readonly number[] };
  /** Every frame even on a phone (no stride): a set made for the phone (WEBSITE 28). */
  full?: boolean;
  /** Its frames in AVIF as well, next to the WebP ones (WEBSITE 29, scripts/walk-avif.mjs). */
  avif?: boolean;
};
export type Shape = 'landscape' | 'portrait';
export const journey: Record<Shape, Sequence> = {
  landscape: {
    path: '/journey/seq/f',
    count: 381,
    ext: 'webp',
    pad: 3,
    rev: 1,
    avif: true,
    // RIFE v4.6, t = 0.5, every pair (WEBSITE 23); a pair listed in `skip` keeps its real frames
    between: { path: '/journey/mid/f', factor: 2, skip: [] },
  },
  // A phone held upright (WEBSITE 28): the same walk at 540 x 960, fitted and extended from the
  // landscape frames (scripts/walk-portrait.py), every frame and every in-between
  portrait: {
    path: '/journey/portrait/f',
    count: 381,
    ext: 'webp',
    pad: 3,
    rev: 1,
    full: true,
    between: { path: '/journey/portrait-mid/f', factor: 2, skip: [] },
  },
};

/**
 * How two neighbouring frames blend (WEBSITE 22). A crossfade of two frames taken from camera
 * positions far apart shows every edge twice, so each pair fades by how far its picture moves
 * (src/config/walk-pairs.ts): all the way between the two (a window of 0.5) when it moves `soft`
 * px of the 960 px frame or less, over a narrower part of the way the more it moves, and not at all
 * (a cut) from `cutFrom` px. Between a frame and an in-between one (half a pair, WEBSITE 23) the
 * cut comes sooner, from `halfCutFrom` px: at twice the frames a short cut steps less than a fade
 * shows two edges. At rest the walk shows the nearest frame alone (src/motion/walk.ts). Only true
 * neighbours blend: never across a frame of the set between them, decoded or not. Sets of
 * `denseFrom` frames or more are thinned on phones.
 */
export const crossfade = {
  denseFrom: 150,
  window: 0.5,
  soft: 6,
  cutFrom: 32,
  halfCutFrom: 24,
};

/**
 * The fade window between two frames `from` and `to` of a set (fractions for in-between frames): by
 * how far the picture moves over that stretch. Sets without a motion map fade all the way.
 */
export function pairWindow({ count }: Sequence, from: number, to: number) {
  if (pairMotion.length !== count - 1 || to <= from) return crossfade.window;
  let moved = 0;
  const halves = halfMotion.length === 2 * (count - 1);
  if (halves && (from % 1 !== 0 || to % 1 !== 0)) {
    // Through in-between frames: the halves of pairs, each measured
    for (let j = Math.floor(from * 2); j < Math.ceil(to * 2) && j < halfMotion.length; j++) {
      moved += halfMotion[j] * 2 * (Math.min(to, (j + 1) / 2) - Math.max(from, j / 2));
    }
  } else {
    for (let i = Math.floor(from); i < Math.ceil(to) && i < pairMotion.length; i++) {
      // The share of pair i that lies between the two
      moved += pairMotion[i] * (Math.min(to, i + 1) - Math.max(from, i));
    }
  }
  if (moved >= (to - from <= 0.5 ? crossfade.halfCutFrom : crossfade.cutFrom)) return 0;
  return Math.min(crossfade.window, (crossfade.window * crossfade.soft) / Math.max(moved, 1e-6));
}

/**
 * How the frames are loaded (src/motion/walk.ts, src/motion/frames.worker.ts), in two parts.
 *
 * The files: once the page has loaded and painted, at the visitor's first scroll, tap or key, or
 * `backgroundAfter` ms later if there is none, and when it is quiet, a worker fetches every frame
 * of the set in use, `fetchers` at a time (fewer on a phone), at low priority, from where the
 * walk is outward. It keeps their compressed bytes in memory and in the Cache API (`cache`, one
 * cache per name, the frames' addresses carrying the render), so a return visit needs no network.
 * To save data only the frames the walk comes to are fetched. Once the set is held, on a good
 * connection (4G or better, not saving data), tier 2 follows the same way: the in-between frames on
 * a wide screen, the frames its thinned set skips on a phone (src/motion/walk-frames.ts, tierTwo).
 * Until it is held, the first window round the walk is decoded a few frames at a time in quiet
 * moments (`firstDecoders`), so it never holds up the page.
 *
 * The pictures: only the frames within `window` of where the walk is are kept decoded (from the
 * bytes in memory, in milliseconds), or while it moves `ahead` in front and `behind` behind, and
 * every `anchorEvery`-th one, so a jump always has a frame close by. Where tier 2 makes the frames
 * denser the window narrows to match, so about as many stay decoded (about 70 frames of 2 MB). On phones (screens under
 * `phoneWidth` px) a dense set uses every `phoneStride`-th frame; so do slow connections (below 4G)
 * and saving data.
 */
export const loading = {
  window: 24,
  anchorEvery: 20,
  phoneStride: 2,
  phoneWidth: 768,
  ahead: 40,
  behind: 8,
  fetchers: 6,
  phoneFetchers: 4,
  decoders: 4,
  firstDecoders: 2,
  // Frames held decoded or on their way, at most (2 MB each: about 150 MB), WEBSITE 25
  maxDecoded: 72,
  // A first visit (WEBSITE 29): the frames near the walk fetched first, both tiers, this many frames
  // ahead of the way it goes and behind; the list ordered again every `refetchEvery` frames it moves
  // Two whole frames with their in-between not in yet: at least this much crossfade (a first visit)
  softGap: 0.16,
  nearAhead: 60,
  nearBehind: 20,
  refetchEvery: 12,
  // A phone (WEBSITE 28): a narrower window (about 36 frames) and at most 46 decoded, 2 MB each
  // (about 95 MB: iOS Safari's limits)
  phoneScale: 0.5,
  phoneMaxDecoded: 46,
  backgroundAfter: 6000,
  cache: 'walk-frames',
  // The first visit's intro (WEBSITE 25, src/motion/walk-gate.ts): it waits for every
  // `introEvery`-th frame of the set and the frames within `introWindow` of the walk, and (WEBSITE
  // 29) both tiers of the scene ahead, up to `introAhead` frames on (from the top: the locker room,
  // to the tunnel), so a fast first scroll has film, not single frames; then opens; never longer
  // than `introCap` ms from the page's start, whatever the connection
  introEvery: 6,
  introWindow: 12,
  introAhead: 84,
  // ... and the frames nearest the start decoded, this many (the rest decode behind it)
  introDecoded: 24,
  introCap: 6500,
  introFetchers: 6,
};

/** The keys that scroll the page: held while the intro is up. */
const INTRO_KEYS = [' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'];

/** Where a visit notes that it held a set whole (its render and stride): the next has no intro. */
export const heldKey = ({ path, rev }: Pick<Sequence, 'path' | 'rev'>, stride: number) =>
  `walk-held ${path} ${rev} ${stride}`;

/**
 * Run as the page is parsed, before its first paint (src/components/walk-intro.tsx): whether this
 * visit gets the intro, so a return visit never sees it flash. None on a phone (its walk is a
 * drawing, WEBSITE 27: nothing to wait for), to save data, under reduced motion, or when the set
 * at this screen's stride was held whole before (src/motion/walk-frames.ts, strideFor). With one it sets <html data-walk-gate="open"> and holds the
 * page still from that moment (the wheel, one finger, the scroll keys; Skip keeps its keys; Tab
 * goes to Skip, so the page behind is out of reach) until
 * the motion code lets go (window.__introRelease) or, should that code never come, 9.5 s on, as
 * CSS lets the intro go by itself.
 */
export const INTRO_SCRIPT = (() => {
  const { landscape } = journey;
  const thinned = landscape.count >= crossfade.denseFrom ? loading.phoneStride : 1;
  const key = JSON.stringify(heldKey(landscape, 0).slice(0, -1));
  const keys = JSON.stringify(Object.fromEntries(INTRO_KEYS.map((k) => [k, 1])));
  return `(function(){try{var d=document.documentElement,c=navigator.connection||{};if(c.saveData||innerWidth<${loading.phoneWidth}||matchMedia('(prefers-reduced-motion: reduce)').matches)return;var s=innerWidth<${loading.phoneWidth}||/^(slow-2g|2g|3g)$/.test(c.effectiveType||'')?${thinned}:1;if(localStorage.getItem(${key}+s)==='1')return;d.dataset.walkGate='open';var K=${keys},o={capture:true,passive:false},t=['wheel','touchmove','keydown'],h=function(e){if(e.key==='Tab'){e.preventDefault();var b=document.querySelector('[data-walk-gate-skip]');if(b)b.focus();return}if(e.touches&&e.touches.length>1)return;if(e.type==='keydown'&&(!K[e.key]||(e.target.closest&&e.target.closest('[data-walk-gate-skip]'))))return;e.preventDefault();e.stopImmediatePropagation()};t.forEach(function(n){addEventListener(n,h,o)});var r=window.__introRelease=function(){t.forEach(function(n){removeEventListener(n,h,o)})};setTimeout(r,9500)}catch(e){}})()`;
})();

/**
 * Where the panels change colour with the walk (0 to 1 of the walk, so they follow the frame
 * count): the locker room, the tunnel, the field. The colours are in src/config/stages.ts. Between
 * two stages the colours blend over `blend` of the shorter stage, centred on the boundary.
 */
export type StageId = 'locker' | 'tunnel' | 'field';
export const stageRanges: Record<StageId, { from: number; to: number }> = {
  locker: { from: 0, to: 0.22 },
  tunnel: { from: 0.22, to: 0.59 },
  field: { from: 0.59, to: 1 },
};
export const stageBlend = 0.4;

/** The frame each stage starts on, for a set of `count` frames. */
export const stageFrames = (count: number) =>
  Object.fromEntries(
    Object.entries(stageRanges).map(([id, { from }]) => [id, Math.round(from * (count - 1))]),
  ) as Record<StageId, number>;

export type SceneId = 'locker' | 'tunnel' | 'pitch';

/** The part of the walk (0 to 1) each label belongs to. Names live in src/i18n (journey). */
export const scenes: Record<SceneId, { from: number; to: number }> = {
  locker: { from: 0, to: 0.15 },
  tunnel: { from: 0.15, to: 0.5 },
  pitch: { from: 0.5, to: 1 },
};

/** Where a frame's file is in public/. */
export const framePath = ({ path, pad, ext }: Sequence, i: number) =>
  `${path}${String(i).padStart(pad, '0')}.${ext}`;

/**
 * A frame's address: its file and the render it is from, so it can be cached for good (the
 * /journey/ files are served immutable, next.config.ts). A fraction is an in-between frame.
 */
/**
 * Which file the walk fetches (WEBSITE 29): AVIF where the browser decodes it (about 45% fewer
 * bytes, scripts/walk-avif.mjs), else WebP. Set once by the motion code before the walk starts
 * (src/motion/walk.ts, chooseFormat); the page itself (the preload, the stills) keeps WebP.
 */
export const frameFormat = { avif: false };

export function frameUrl(sequence: Sequence, at: number) {
  const { between, rev, pad } = sequence;
  // The first frame stays WebP: the page preloads it before a script knows the format
  const ext = sequence.avif && frameFormat.avif && at !== 0 ? 'avif' : sequence.ext;
  const whole = Math.floor(at);
  if (between && at !== whole) {
    const k = Math.round((at - whole) * between.factor);
    return `${between.path}${String(whole).padStart(pad, '0')}-${k}.${ext}?v=${rev}`;
  }
  return `${sequence.path}${String(at).padStart(pad, '0')}.${ext}?v=${rev}`;
}

export const frameAt = ({ count }: Sequence, progress: number) =>
  Math.round(progress * (count - 1));

export const sceneAt = (progress: number): SceneId =>
  (Object.keys(scenes) as SceneId[]).find((id) => progress < scenes[id].to) ?? 'pitch';

/** Where the picture that stands for a scene is taken, when nothing is scrubbed. */
export const stillAt: Record<SceneId, number> = {
  locker: 0,
  tunnel: (scenes.tunnel.from + scenes.tunnel.to) / 2,
  pitch: 1,
};
