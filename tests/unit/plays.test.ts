import { describe, expect, it } from 'vitest';

import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';
import { buildPlay } from '@/motion/play-engine';
import { PLAYER_IDS, PLAYS } from '@/motion/plays';

const distance = (a: readonly number[], b: readonly number[]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('hero plays', () => {
  it('are at least four different ones, each named in both languages', () => {
    expect(PLAYS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(PLAYS.map((play) => play.id)).size).toBe(PLAYS.length);
    expect(new Set(PLAYS.map((play) => JSON.stringify(play.phases))).size).toBe(PLAYS.length);
    expect(en.hero.drill.plays).toHaveLength(PLAYS.length);
    expect(ar.hero.drill.plays).toHaveLength(PLAYS.length);
  });

  describe.each(PLAYS.map((play) => [play.id, play] as const))('%s', (_, play) => {
    const built = buildPlay(play);

    it('stays on the board, with time moving forward', () => {
      for (const frames of [...PLAYER_IDS.map((id) => built.players[id]), built.ball]) {
        expect(frames[0].offset).toBe(0);
        expect(frames[frames.length - 1].offset).toBe(1);
        frames.forEach(({ point: [x, y], offset }, i) => {
          expect(x).toBeGreaterThan(14);
          expect(x).toBeLessThan(466);
          expect(y).toBeGreaterThan(20);
          expect(y).toBeLessThan(406);
          if (i > 0) expect(offset).toBeGreaterThanOrEqual(frames[i - 1].offset);
        });
      }
    });

    it('has at most three near the ball, one presser at a time, and nobody on top of another', () => {
      const where = { ...play.start };
      let holder = play.ball;
      for (const phase of play.phases) {
        Object.assign(where, phase.move);
        if (!phase.ball || typeof phase.ball !== 'string') continue;
        holder = phase.ball;
        const others = PLAYER_IDS.filter((id) => id[0] !== holder[0]);
        const gaps = others.map((id) => distance(where[id], where[holder]));
        expect(gaps.filter((gap) => gap < 60).length).toBeLessThanOrEqual(2);
        expect(gaps.filter((gap) => gap < 110).length).toBeLessThanOrEqual(3);
        for (const a of PLAYER_IDS) {
          for (const b of PLAYER_IDS) {
            if (a < b) expect(distance(where[a], where[b]), `${a} ${b}`).toBeGreaterThan(26);
          }
        }
      }
    });
  });
});
