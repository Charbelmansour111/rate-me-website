/**
 * The walk behind the home page: a numbered sequence of images, drawn by the scroll. For a new
 * render, replace the files and change `count`; everything else is worked out from it.
 */
export const journey = { path: '/journey/seq/f', count: 48, ext: 'webp', pad: 3 } as const;

export type SceneId = 'locker' | 'tunnel' | 'pitch';

/** The part of the walk (0 to 1) each label belongs to. Names live in src/i18n (journey). */
export const scenes: Record<SceneId, { from: number; to: number }> = {
  locker: { from: 0, to: 0.15 },
  tunnel: { from: 0.15, to: 0.5 },
  pitch: { from: 0.5, to: 1 },
};

export const frameUrl = (i: number) =>
  `${journey.path}${String(i).padStart(journey.pad, '0')}.${journey.ext}`;

export const frameAt = (progress: number) => Math.round(progress * (journey.count - 1));

export const sceneAt = (progress: number): SceneId =>
  (Object.keys(scenes) as SceneId[]).find((id) => progress < scenes[id].to) ?? 'pitch';

/** The picture that stands for a scene where nothing is scrubbed: start, middle and end. */
export const stillFrame: Record<SceneId, number> = {
  locker: 0,
  tunnel: frameAt((scenes.tunnel.from + scenes.tunnel.to) / 2),
  pitch: journey.count - 1,
};
