/**
 * The walk behind the home page: numbered images, drawn by the scroll. `portrait` is used where the
 * screen is taller than wide, once all its files are there; until then `landscape` is used
 * everywhere. For a new render, replace the files and change `count`; the rest follows from it.
 */
export type Sequence = { path: string; count: number; ext: string; pad: number };
export type Shape = 'landscape' | 'portrait';
export const journey: Record<Shape, Sequence> = {
  landscape: { path: '/journey/seq/f', count: 191, ext: 'webp', pad: 3 },
  portrait: { path: '/journey/portrait/f', count: 48, ext: 'webp', pad: 3 },
};

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
