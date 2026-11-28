import { buildPlay, type Frame } from './play-engine';
import { PLAYS, type PlayerId } from './plays';
import { mirror, type Point } from './tactics-data';
import type { Walk } from './walk';

/** Where a list of frames (offsets 0 to 1) is at `t`. */
function sample(frames: Frame[], t: number): Point {
  let i = 1;
  while (i < frames.length - 1 && frames[i].offset < t) i++;
  const a = frames[i - 1];
  const b = frames[i];
  const span = b.offset - a.offset;
  const k = span > 0 ? Math.min(1, Math.max(0, (t - a.offset) / span)) : 1;
  const ease = k * k * (3 - 2 * k);
  return [
    a.point[0] + (b.point[0] - a.point[0]) * ease,
    a.point[1] + (b.point[1] - a.point[1]) * ease,
  ];
}

type Board = {
  el: HTMLElement;
  /** The pitch drawing the players are placed on, in % of its size. */
  pitch: HTMLElement;
  gap: HTMLElement;
  players: { el: HTMLElement; frames: Frame[]; start: Point }[];
  ball: { el: HTMLElement; frames: Frame[]; start: Point };
  trail: SVGPathElement | null;
  /** When each pass starts and ends, in the play's time (0 to 1), to draw the route as it goes. */
  passes: [number, number][];
  top: number;
  height: number;
  width: number;
  shown: number;
};

/**
 * The small boards in the open views on a phone (src/components/journey-walk.tsx, WEBSITE 25): each
 * plays its play as the walk passes its view, from the moment the view comes in at the bottom to
 * when it leaves at the top, so the players move with the walk, and the route draws in orange.
 * Called with the walk's progress in the same frame as the picture (src/motion/walk-scroll.ts).
 * Only transforms and a stroke move, on boards on the screen: nothing is laid out again.
 */
export function followBoards(signal: AbortSignal, walk: Walk) {
  const els = [...document.querySelectorAll<HTMLElement>('[data-gap-board]')];
  const phone = matchMedia('(max-width: 47.99rem)');
  const rtl = document.documentElement.dir === 'rtl';
  const boards: Board[] = els.map((el) => {
    const play = PLAYS[Number(el.dataset.gapBoard) % PLAYS.length];
    const built = buildPlay(play);
    const start = (id: PlayerId) => mirror(play.start[id], rtl);
    const duration = built.duration;
    return {
      el,
      pitch: el.querySelector<HTMLElement>('.gap-pitch')!,
      gap: el.parentElement!,
      players: [...el.querySelectorAll<HTMLElement>('[data-player]')].map((player) => {
        const id = player.dataset.player as PlayerId;
        return { el: player, frames: built.players[id], start: start(id) };
      }),
      ball: {
        el: el.querySelector<HTMLElement>('[data-ball]')!,
        frames: built.ball,
        start: mirror(built.ball[0].point, rtl),
      },
      trail: el.querySelector<SVGPathElement>('[data-gap-trail]'),
      // Each pass flies 0.2 to 1.1 s into its phase (src/motion/play-engine.ts)
      passes: built.passes.map(({ phase }) => {
        const begin = 0.9 + phase * 1.7 + 0.2;
        return [begin / duration, (begin + 0.9) / duration];
      }),
      top: 0,
      height: 1,
      width: 1,
      shown: -1,
    };
  });
  // Measured after layout, never in the scroll's frame
  const sized = new ResizeObserver(() => {
    for (const board of boards) {
      board.top = board.gap.getBoundingClientRect().top + scrollY;
      board.height = board.gap.offsetHeight;
      board.width = board.pitch.clientWidth;
      board.shown = -1;
    }
  });
  sized.observe(document.body);
  for (const board of boards) {
    board.el.dataset.live = '';
    sized.observe(board.el);
  }
  signal.addEventListener('abort', () => {
    sized.disconnect();
    for (const board of boards) {
      delete board.el.dataset.live;
      for (const one of [...board.players, board.ball]) one.el.style.removeProperty('transform');
      board.trail?.style.removeProperty('stroke-dashoffset');
    }
  });

  const place = ({ el, frames, start }: Board['ball'], t: number, scale: number) => {
    const [x, y] = mirror(sample(frames, t), rtl);
    el.style.transform = `translate3d(${((x - start[0]) * scale).toFixed(1)}px, ${((y - start[1]) * scale).toFixed(1)}px, 0)`;
  };

  return (progress: number) => {
    if (!phone.matches || !boards.length) return;
    // Where the walk is, in px of the page: the boards keep to the picture, not the scroll
    const y = progress * walk.end();
    for (const board of boards) {
      const t = Math.min(
        1,
        Math.max(0, (y + innerHeight - board.top) / (board.height + innerHeight)),
      );
      // Off the screen, or not moved since: nothing to do
      if (Math.abs(t - board.shown) < 0.0005) continue;
      board.shown = t;
      const scale = board.width / 480;
      for (const player of board.players) place(player, t, scale);
      place(board.ball, t, scale);
      if (board.trail) {
        // The route so far: each pass drawn as it flies, in an equal share of the line
        const done = board.passes.reduce(
          (sum, [a, b]) => sum + Math.min(1, Math.max(0, (t - a) / (b - a))),
          0,
        );
        board.trail.style.strokeDashoffset = String(1 - done / Math.max(1, board.passes.length));
      }
    }
  };
}
