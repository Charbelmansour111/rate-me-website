/**
 * The walk behind the home page: numbered images, drawn by the scroll. `portrait` is used where the
 * screen is taller than wide, once all its files are there; until then `landscape` is used
 * everywhere. For a new render, replace the files and change `count`; the rest follows from it.
 */
export type Sequence = { path: string; count: number; ext: string; pad: number };
export type Shape = 'landscape' | 'portrait';
export const journey: Record<Shape, Sequence> = {
  landscape: { path: '/journey/seq/f', count: 381, ext: 'webp', pad: 3 },
  portrait: { path: '/journey/portrait/f', count: 48, ext: 'webp', pad: 3 },
};

/**
 * How two neighbouring frames blend between them. A crossfade of two frames far apart is a double
 * image (two jerseys where there is one), so in a dense set the nearest frame shows alone and the
 * next one fades in only within `window` of a frame either side of the midpoint. A set with fewer
 * than `denseFrom` frames fades over the whole gap (a window of 0.5): with 48 frames a cut would
 * jump. The 191-frame set already showed a double "9" with a full fade, so it counts as dense.
 */
export const crossfade = { denseFrom: 150, window: 0.15 };

/**
 * How the frames are loaded (src/motion/walk.ts). Only the frames within `window` of where the walk
 * is are kept decoded; the others are let go and fetched again (from the browser's cache) when the
 * walk comes back to them. Every `anchorEvery`-th frame stays, so a jump always has a frame close
 * by. On phones (screens under `phoneWidth` px) a dense set uses every `phoneStride`-th frame.
 * Nothing is fetched before the page has loaded and painted.
 */
export const loading = { window: 24, anchorEvery: 16, phoneStride: 2, phoneWidth: 768 };

/** The fade window for a set of `count` frames. */
export const fadeWindow = (count: number) =>
  count >= crossfade.denseFrom ? crossfade.window : 0.5;

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

export const frameUrl = ({ path, pad, ext }: Sequence, i: number) =>
  `${path}${String(i).padStart(pad, '0')}.${ext}`;

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
