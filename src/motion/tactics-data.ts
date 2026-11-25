/** The tactics illustration: an original little play, on a 480 x 420 board with the goal on top. */
export type Point = readonly [x: number, y: number];
export const WIDTH = 480;

/** Attackers, with where they drift in from. The ball goes 0 > 1 > 2 > 3. */
export const ATTACKERS: { at: Point; from: Point; label: string }[] = [
  { at: [70, 300], from: [-30, 60], label: '6' },
  { at: [190, 350], from: [10, 50], label: '8' },
  { at: [320, 340], from: [-10, 55], label: '10' },
  { at: [410, 250], from: [40, 40], label: '7' },
];

/** Press, cover, second cover: where they stand, and where they go for each ball carrier. */
export const DEFENDERS: { at: Point; from: Point; moves: Point[] }[] = [
  {
    at: [150, 222],
    from: [-40, -40],
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
    moves: [
      [190, 224],
      [232, 240],
      [296, 222],
      [300, 184],
    ],
  },
  {
    at: [350, 205],
    from: [40, -40],
    moves: [
      [290, 196],
      [340, 204],
      [400, 214],
      [408, 146],
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
