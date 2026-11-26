import type { CSSProperties, ReactNode } from 'react';
import { preload } from 'react-dom';

import {
  frameAt,
  frameUrl,
  journey,
  stillAt,
  type SceneId,
  type Sequence,
} from '@/config/journey.config';
import { hasFrames } from '@/lib/journey-files';

const { landscape } = journey;
const portrait = hasFrames(journey.portrait) ? journey.portrait : null;

/** One picture for each shape of screen; the CSS takes the right one, so only that one loads. */
const still = (scene: SceneId) => {
  const url = (sequence: Sequence) =>
    `url(${frameUrl(sequence, frameAt(sequence, stillAt[scene]))})`;
  return { '--wide': url(landscape), '--tall': url(portrait ?? landscape) } as CSSProperties;
};

/**
 * The walk from the locker room to the pitch, behind the page. The canvas carries the first frame
 * as its background, so it is there at first paint; src/motion/walk.ts draws the rest.
 */
export function WalkCanvas() {
  const first = { as: 'image', fetchPriority: 'high' } as const;
  if (portrait) {
    preload(frameUrl(landscape, 0), { ...first, media: '(orientation: landscape)' });
    preload(frameUrl(portrait, 0), { ...first, media: '(orientation: portrait)' });
  } else {
    preload(frameUrl(landscape, 0), first);
  }
  return (
    <canvas
      data-walk
      data-portrait={portrait ? '' : undefined}
      className="walk"
      aria-hidden="true"
      style={still('locker')}
    />
  );
}

/** A part of the page. Without scrubbing, one still picture stands behind it. */
export function WalkGroup({ scene, children }: { scene: SceneId; children: ReactNode }) {
  return (
    <div className="walk-group">
      <div className="walk-still" aria-hidden="true" style={still(scene)} />
      <div className="walk-content">{children}</div>
    </div>
  );
}

/** An open view between two sections: the walk shows through, with nothing written on it. */
export function WalkGap() {
  return <div className="walk-gap" data-walk-gap aria-hidden="true" />;
}
