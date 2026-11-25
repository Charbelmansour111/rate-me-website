/** The tactics illustration: an original little play, on a 480 x 420 board with the goal on top. */
import type { RoleId } from '@/config/roles.config';

export type Point = readonly [x: number, y: number];
export const WIDTH = 480;

/**
 * Attackers, with where they drift in from. The ball goes 0 > 1 > 2 > 3.
 * A run starts just after pass number `after`.
 */
export const ATTACKERS: {
  at: Point;
  from: Point;
  label: string;
  role?: RoleId;
  run?: { after: number; to: Point };
}[] = [
  {
    at: [70, 300],
    from: [-30, 60],
    label: '6',
    role: 'overlap',
    run: { after: 0, to: [56, 190] },
  },
  { at: [190, 350], from: [10, 50], label: '8' },
  {
    at: [320, 340],
    from: [-10, 55],
    label: '10',
    role: 'run_behind',
    run: { after: 2, to: [270, 116] },
  },
  { at: [410, 250], from: [40, 40], label: '7' },
];

/** Where the defenders stand, and where they go for each ball carrier. The last one marks the 7. */
export const DEFENDERS: { at: Point; from: Point; role: RoleId; moves: Point[] }[] = [
  {
    at: [150, 222],
    from: [-40, -40],
    role: 'press',
    moves: [
      [112, 264],
      [186, 302],
      [306, 294],
      [372, 224],
    ],
  },
  {
    at: [244, 168],
    from: [0, -50],
    role: 'cover',
    moves: [
      [150, 196],
      [212, 232],
      [296, 222],
      [345, 166],
    ],
  },
  {
    at: [384, 202],
    from: [40, -40],
    role: 'mark',
    moves: [
      [386, 200],
      [390, 202],
      [396, 206],
      [420, 196],
    ],
  },
];

/** The bend of each pass. */
const BENDS: Point[] = [
  [110, 360],
  [255, 385],
  [390, 330],
];

export const PASSES = BENDS.map((bend, i) => ({
  from: ATTACKERS[i].at,
  bend,
  to: ATTACKERS[i + 1].at,
}));

/** In Arabic the play runs the other way. */
export const mirror = ([x, y]: Point, rtl: boolean): Point => [rtl ? WIDTH - x : x, y];
export const translate = ([x, y]: Point) => `translate(${x}px, ${y}px)`;

/** A point of a pass, 0 to 1. */
export function along({ from, bend, to }: (typeof PASSES)[number], t: number): Point {
  const mix = (i: 0 | 1) => (1 - t) ** 2 * from[i] + 2 * (1 - t) * t * bend[i] + t ** 2 * to[i];
  return [Math.round(mix(0) * 10) / 10, Math.round(mix(1) * 10) / 10];
}
