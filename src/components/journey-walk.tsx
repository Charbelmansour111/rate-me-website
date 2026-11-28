import type { CSSProperties, ReactNode } from 'react';
import { preload } from 'react-dom';

import {
  frameAt,
  frameUrl,
  journey,
  stillAt,
  type SceneId,
  type Sequence,
  type StageId,
} from '@/config/journey.config';
import { hasFrames } from '@/lib/journey-files';

const { landscape } = journey;
const portrait = hasFrames(journey.portrait) ? journey.portrait : null;

/** One picture for each shape of screen; the CSS takes the right one, so only that one loads. */
const still = (scene: SceneId) => {
  const url = (sequence: Sequence) =>
    `url(${frameUrl(sequence, frameAt(sequence, stillAt[scene]))})`;
  // The stills are for computers and tablets (a phone's are drawn, src/app/journey.css): landscape
  return { '--wide': url(landscape), '--tall': url(landscape) } as CSSProperties;
};

/**
 * The walk from the locker room to the pitch, behind the page. The canvas carries the first frame
 * as its background, so it is there at first paint; src/motion/walk.ts draws the rest.
 */
export function WalkCanvas() {
  // The landscape walk's first frame: never on a phone (WEBSITE 27)
  const first = { as: 'image', fetchPriority: 'high', media: '(min-width: 48rem)' } as const;
  preload(frameUrl(landscape, 0), first);
  // A phone held upright: its own set's first frame, drawn on the canvas at once (WEBSITE 28)
  if (portrait) {
    preload(frameUrl(portrait, 0), {
      as: 'image',
      media: '(max-width: 47.99rem) and (orientation: portrait)',
    });
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

/** Dims the walk over the end of the page, under the footer (src/motion/chrome.ts). */
export function WalkDim() {
  return <div className="walk-dim" data-walk-dim aria-hidden="true" />;
}

/** The panels' colours for each part (src/config/stages.ts). */
const STAGE: Record<SceneId, StageId> = { locker: 'locker', tunnel: 'tunnel', pitch: 'field' };

/**
 * A part of the page. Without scrubbing, one still picture stands behind it and its panels keep
 * their stage's colours.
 */
export function WalkGroup({ scene, children }: { scene: SceneId; children: ReactNode }) {
  return (
    <div className="walk-group" data-stage={STAGE[scene]}>
      <div className="walk-still" aria-hidden="true" style={still(scene)} />
      <div className="walk-content">{children}</div>
    </div>
  );
}

/** An open view between two sections: the walk shows through, with nothing written on it. */
export function WalkGap() {
  return <div className="walk-gap" data-walk-gap aria-hidden="true" />;
}
