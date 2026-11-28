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
import { buildPlay, passPath } from '@/motion/play-engine';
import { PLAYER_IDS, PLAYS } from '@/motion/plays';
import { mirror } from '@/motion/tactics-data';

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

/**
 * The ground round the walk's window on a phone (src/app/journey.css): dark, in the colour of the
 * frame's own edges (src/motion/walk.ts). Nothing on wider screens.
 */
export function WalkGround() {
  return <div className="walk-ground" data-walk-ground aria-hidden="true" />;
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

const LABELS = ['6', '8', '10', '7'];

/**
 * A small board in the hero board's style, for the open views between sections on a phone
 * (WEBSITE 25): the pitch lines, numbered players and the ball's route in orange. With motion, its
 * play runs with the walk as the view passes (src/motion/gap-boards.ts); without, it stands at
 * the start with the route drawn. Players are placed in % of the board, so it never moves the page.
 */
function GapBoard({ n, rtl }: { n: number; rtl: boolean }) {
  const play = PLAYS[n % PLAYS.length];
  const built = buildPlay(play);
  const at = (point: readonly [number, number]) => {
    const [x, y] = mirror(point, rtl);
    return { left: `${(x / 480) * 100}%`, top: `${(y / 420) * 100}%` };
  };
  return (
    <div className="gap-board" data-gap-board={n}>
      <div className="gap-pitch">
        <svg viewBox="0 0 480 420" fill="none" className="block h-auto w-full">
          <g stroke="var(--chalk)" strokeWidth="2">
            <path d="M14 30H466V406H14Z M120 30V126H360V30 M184 30V66H296V30" />
            <path d="M194 126A52 52 0 0 0 286 126 M184 406A56 56 0 0 1 296 406" />
          </g>
          <path d="M204 30V12H276V30" stroke="var(--text)" strokeWidth="4" />
          <path
            data-gap-trail
            d={built.passes.map((pass) => passPath(pass, rtl)).join('')}
            pathLength={1}
            stroke="var(--accent)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {PLAYER_IDS.map((id) => (
          <span
            key={id}
            data-player={id}
            className={id.startsWith('a') ? 'gap-player' : 'gap-player gap-defender'}
            style={at(play.start[id])}
          >
            {id.startsWith('a') ? LABELS[Number(id[1])] : null}
          </span>
        ))}
        <span data-ball className="gap-ball" style={at(built.ball[0].point)} />
      </div>
    </div>
  );
}

/**
 * An open view between two sections: the walk shows through, with nothing written on it; on a
 * phone, a small board (`n`: which play) under the walk's window.
 */
export function WalkGap({ n, rtl }: { n: number; rtl: boolean }) {
  return (
    <div className="walk-gap" data-walk-gap aria-hidden="true">
      <GapBoard n={n} rtl={rtl} />
    </div>
  );
}
