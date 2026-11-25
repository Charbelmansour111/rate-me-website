import { PLAYER_IDS, type Play, type PlayerId } from './plays';
import { mirror, translate, type Point } from './tactics-data';

/** Seconds. A phase is slow enough to see who presses, who covers and who comes behind. */
const LEAD = 0.9;
const PHASE = 1.7;
const TAIL = 1.4;
const FADE = 0.35;
const FEET: Point = [13, 13];

const isPoint = (ball: PlayerId | Point): ball is Point => typeof ball !== 'string';
const atFeet = ([x, y]: Point): Point => [x + FEET[0], y + FEET[1]];

type Pass = { from: Point; bend: Point; to: Point; phase: number };
export type Frame = { offset: number; point: Point; opacity: number };
export type Built = {
  duration: number;
  players: Record<PlayerId, Frame[]>;
  ball: Frame[];
  passes: Pass[];
};

/** Where a pass bends: off the middle, to its side. */
function control(from: Point, to: Point, bend: number): Point {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy) || 1;
  return [
    Math.round((from[0] + to[0]) / 2 - (dy / length) * bend),
    Math.round((from[1] + to[1]) / 2 + (dx / length) * bend),
  ];
}

function bezier({ from, bend, to }: Pass, t: number): Point {
  const mix = (i: 0 | 1) => (1 - t) ** 2 * from[i] + 2 * (1 - t) * t * bend[i] + t * t * to[i];
  return [Math.round(mix(0) * 10) / 10, Math.round(mix(1) * 10) / 10];
}

/** Turns a play into positions over time. Pure: the browser part is in hero.ts. */
export function buildPlay(play: Play): Built {
  const duration = LEAD + play.phases.length * PHASE + TAIL;
  const at = (seconds: number) => Math.min(1, seconds / duration);
  const where = { ...play.start };
  const players = {} as Record<PlayerId, Frame[]>;
  const shown = (seconds: number, point: Point): Frame => ({
    offset: at(seconds),
    point,
    opacity: 1,
  });
  for (const id of PLAYER_IDS) {
    players[id] = [{ offset: 0, point: where[id], opacity: 0 }, shown(FADE, where[id])];
  }
  let ball = atFeet(where[play.ball]);
  const frames: Frame[] = [{ offset: 0, point: ball, opacity: 0 }, shown(FADE, ball)];
  const passes: Pass[] = [];
  let holder: PlayerId | Point = play.ball;

  play.phases.forEach(({ ball: to = holder, bend = 0, move = {} }, phase) => {
    const begin = LEAD + phase * PHASE;
    for (const id of PLAYER_IDS) {
      const next = move[id];
      if (!next) continue;
      // The side without the ball reacts a beat later.
      const late = id.startsWith('d') ? 0.3 : 0;
      players[id].push(shown(begin + late, where[id]), shown(begin + late + 1.2, next));
      where[id] = next;
    }
    const target = isPoint(to) ? to : atFeet(where[to]);
    if (to === holder) {
      // Running with the ball
      frames.push(shown(begin, ball), shown(begin + 1.2, target));
    } else {
      const pass = { from: ball, bend: control(ball, target, bend), to: target, phase };
      passes.push(pass);
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        frames.push(shown(begin + 0.2 + t * 0.9, bezier(pass, 1 - (1 - t) ** 2)));
      }
    }
    ball = target;
    holder = to;
  });

  const end = (list: Frame[]) => {
    const { point } = list[list.length - 1];
    list.push(shown(duration - FADE, point), { offset: 1, point, opacity: 0 });
  };
  for (const id of PLAYER_IDS) end(players[id]);
  end(frames);
  return { duration, players, ball: frames, passes };
}

/** A pass as a path, with an arrowhead at its end. */
export function passPath({ from, bend, to }: Pass, rtl: boolean): string {
  const p = (point: Point) => mirror(point, rtl).join(' ');
  const angle = Math.atan2(to[1] - bend[1], to[0] - bend[0]);
  const wing = (turn: number): Point => [
    Math.round(to[0] - 12 * Math.cos(angle + turn)),
    Math.round(to[1] - 12 * Math.sin(angle + turn)),
  ];
  return `M${p(from)}Q${p(bend)} ${p(to)}M${p(wing(0.5))}L${p(to)}L${p(wing(-0.5))}`;
}

export function toKeyframes(frames: Frame[], rtl: boolean, easing = 'ease-in-out'): Keyframe[] {
  return frames.map(({ offset, point, opacity }) => ({
    offset,
    opacity,
    easing,
    transform: translate(mirror(point, rtl)),
  }));
}

/** A trail draws with its pass and then fades. */
export function trailKeyframes({ phase }: Pass, duration: number): Keyframe[] {
  const begin = LEAD + phase * PHASE + 0.2;
  const frame = (seconds: number, strokeDashoffset: number, opacity: number): Keyframe => ({
    offset: Math.min(1, seconds / duration),
    strokeDasharray: '1',
    strokeDashoffset,
    opacity,
  });
  return [
    frame(0, 1, 0),
    frame(begin, 1, 0),
    frame(begin + 0.01, 1, 1),
    frame(begin + 0.9, 0, 1),
    frame(Math.min(begin + 2.6, duration - 0.01), 0, 0),
    frame(duration, 0, 0),
  ];
}
