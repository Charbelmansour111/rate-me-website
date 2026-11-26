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
    // A run round the outside (the app's Run, its movement: overlap)
    role: 'run',
    run: { after: 0, to: [56, 190] },
  },
  { at: [190, 350], from: [10, 50], label: '8' },
  {
    at: [320, 340],
    from: [-10, 55],
    label: '10',
    // A run behind the defence (Run, movement: behind)
    role: 'run',
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
      [126, 252],
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

/** Where along a pass its arrowhead sits: short of the receiver, who would cover it. */
export const ARROW_AT = 0.8;

/** The arrowhead of a pass: two short wings either side of the line, pointing along it. */
export function arrowHead(pass: (typeof PASSES)[number], rtl: boolean): string {
  const { from, bend, to } = pass;
  const t = ARROW_AT;
  const [x, y] = along(pass, t);
  // The direction of the curve there
  const dx = 2 * (1 - t) * (bend[0] - from[0]) + 2 * t * (to[0] - bend[0]);
  const dy = 2 * (1 - t) * (bend[1] - from[1]) + 2 * t * (to[1] - bend[1]);
  const angle = Math.atan2(dy, dx);
  const wing = (turn: number): Point => [
    Math.round((x - 11 * Math.cos(angle + turn)) * 10) / 10,
    Math.round((y - 11 * Math.sin(angle + turn)) * 10) / 10,
  ];
  const p = (point: Point) => mirror(point, rtl).join(' ');
  return `M${p(wing(0.55))}L${p([x, y])}L${p(wing(-0.55))}`;
}

/** A point of a pass, 0 to 1. */
export function along({ from, bend, to }: (typeof PASSES)[number], t: number): Point {
  const mix = (i: 0 | 1) => (1 - t) ** 2 * from[i] + 2 * (1 - t) * t * bend[i] + t ** 2 * to[i];
  return [Math.round(mix(0) * 10) / 10, Math.round(mix(1) * 10) / 10];
}

/**
 * The roles a coach can try on the board (src/components/tactics-roles.tsx), as in the app: where
 * the three defenders go while the 6 has the ball. Smart is the play above, chosen by the app.
 */
export const ROLE_CHOICES = ['smart', 'press', 'cover', 'mark', 'zone', 'intercept'] as const;
export type RoleChoice = (typeof ROLE_CHOICES)[number];
export const ROLE_SHAPES: Record<Exclude<RoleChoice, 'smart'>, [Point, Point, Point]> = {
  // The two nearest step up to the player on the ball; the third holds his zone
  press: [
    [104, 268],
    [148, 262],
    [330, 214],
  ],
  // A tight block in front of goal
  cover: [
    [196, 178],
    [244, 142],
    [292, 178],
  ],
  // Each defender goal side of one attacker: the 8, the 10 and the 7
  mark: [
    [194, 288],
    [312, 280],
    [398, 192],
  ],
  // Each guards an area across the box, and steps in when the ball comes into it
  zone: [
    [128, 238],
    [244, 196],
    [360, 238],
  ],
  // One steps into the lane from the 6 to the 8; the others screen the middle
  intercept: [
    [122, 338],
    [240, 262],
    [372, 216],
  ],
};
/** The attackers each defender marks, in the "mark" shape. */
export const MARKED: [Point, Point, Point] = [ATTACKERS[1].at, ATTACKERS[2].at, ATTACKERS[3].at];
