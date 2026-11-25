import type { Point } from './tactics-data';

/**
 * The hero's plays, on the same 480 x 420 board (goal on top). To add one: copy an entry, change
 * the points, and add its name to hero.drill.plays in both i18n files, in the same order.
 *
 * Players: a0-a3 (filled) and d0-d2 (outlined). A phase moves anyone listed, and sends the ball to
 * a player (where that player ends the phase) or to a point (a shot). Nobody listed stays put.
 */
export type PlayerId = 'a0' | 'a1' | 'a2' | 'a3' | 'd0' | 'd1' | 'd2';
export const PLAYER_IDS: PlayerId[] = ['a0', 'a1', 'a2', 'a3', 'd0', 'd1', 'd2'];
export type Phase = {
  ball?: PlayerId | Point;
  /** How far the pass bends to the side; 0 is straight. */
  bend?: number;
  move?: Partial<Record<PlayerId, Point>>;
};
export type Play = {
  id: string;
  start: Record<PlayerId, Point>;
  ball: PlayerId;
  phases: Phase[];
};

export const PLAYS: Play[] = [
  {
    id: 'rondo',
    ball: 'a3',
    start: {
      a0: [110, 240],
      a1: [240, 125],
      a2: [370, 240],
      a3: [240, 355],
      d0: [205, 250],
      d1: [270, 215],
      d2: [262, 290],
    },
    phases: [
      { ball: 'a0', bend: 18, move: { d0: [155, 258], d1: [218, 208], d2: [248, 275] } },
      { ball: 'a1', bend: 18, move: { d0: [205, 168], d1: [285, 205], d2: [232, 255] } },
      { ball: 'a2', bend: 18, move: { d0: [250, 195], d1: [325, 228], d2: [282, 280] } },
      { ball: 'a3', bend: 18, move: { d0: [212, 225], d1: [290, 245], d2: [256, 308] } },
      { ball: 'a1', bend: -70, move: { d0: [212, 168], d1: [300, 205], d2: [250, 250] } },
    ],
  },
  {
    id: 'overlap',
    ball: 'a0',
    start: {
      a0: [140, 345],
      a1: [265, 335],
      a2: [395, 250],
      a3: [340, 385],
      d0: [235, 270],
      d1: [340, 200],
      d2: [240, 160],
    },
    phases: [
      { ball: 'a1', bend: 16, move: { d0: [262, 288], d1: [345, 210] } },
      {
        ball: 'a2',
        bend: -16,
        move: { a3: [425, 330], d0: [318, 258], d1: [372, 206], d2: [285, 165] },
      },
      { ball: 'a2', move: { a2: [372, 242], a3: [446, 190], d1: [368, 200], d2: [320, 150] } },
      {
        ball: 'a3',
        bend: -14,
        move: { a3: [440, 120], a1: [285, 215], d0: [300, 262], d1: [404, 136], d2: [330, 105] },
      },
      { ball: 'a1', bend: 34, move: { a1: [225, 120], d1: [380, 128], d2: [276, 100] } },
      { ball: [214, 36] },
    ],
  },
  {
    id: 'through',
    ball: 'a0',
    start: {
      a0: [110, 335],
      a1: [235, 300],
      a2: [250, 190],
      a3: [405, 285],
      d0: [215, 238],
      d1: [225, 138],
      d2: [325, 160],
    },
    phases: [
      { ball: 'a1', bend: -16, move: { d0: [228, 254], d2: [330, 168] } },
      { ball: 'a1', move: { a2: [178, 215], a3: [385, 225], d1: [195, 168], d2: [322, 172] } },
      {
        ball: 'a3',
        bend: 26,
        move: { a3: [345, 96], d0: [250, 228], d1: [248, 112], d2: [322, 138] },
      },
      { ball: [262, 36], bend: -12, move: { d1: [270, 92], d2: [328, 124] } },
    ],
  },
  {
    id: 'switch',
    ball: 'a0',
    start: {
      a0: [60, 230],
      a1: [155, 330],
      a2: [300, 345],
      a3: [425, 240],
      d0: [112, 232],
      d1: [180, 212],
      d2: [255, 195],
    },
    phases: [
      { ball: 'a1', bend: 14, move: { d0: [148, 284], d1: [205, 238], d2: [275, 205] } },
      { ball: 'a2', bend: 18, move: { d0: [205, 255], d1: [290, 298], d2: [330, 215] } },
      {
        ball: 'a3',
        bend: 46,
        move: { a3: [425, 195], d0: [262, 218], d1: [335, 238], d2: [385, 182] },
      },
      { ball: 'a3', move: { a3: [402, 118], d0: [250, 150], d1: [312, 152], d2: [362, 112] } },
      { ball: [222, 36], bend: 20 },
    ],
  },
  {
    // The outlined side builds up; the filled side presses, covers and wins it.
    id: 'press',
    ball: 'd0',
    start: {
      a0: [195, 190],
      a1: [295, 205],
      a2: [150, 280],
      a3: [330, 290],
      d0: [150, 105],
      d1: [310, 100],
      d2: [235, 245],
    },
    phases: [
      { ball: 'd1', bend: -20, move: { a0: [225, 165], a1: [310, 146], a2: [205, 250] } },
      { ball: 'a0', bend: 10, move: { a0: [252, 170], a1: [318, 138], d2: [262, 226] } },
      { ball: 'a0', move: { a0: [235, 125], a1: [285, 92], d1: [300, 122], d0: [175, 118] } },
      { ball: [226, 36], bend: 8 },
    ],
  },
];
