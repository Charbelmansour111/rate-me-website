import { describe, expect, it } from 'vitest';

import { roleLetters, roles, rolesOf, type RoleId } from '@/config/roles.config';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';
import { ROLE_CHOICES } from '@/motion/tactics-data';

/**
 * The app's roles (rate-me: drill-board/roles-v2/catalog.ts, ATTACKING_SET and DEFENDING_SET),
 * their English names (i18n/en/roles2.ts) and badges.
 */
const APP = {
  smart: ['Smart', 'S'],
  support: ['Support', 'U'],
  run: ['Run', 'R'],
  hold: ['Hold', 'H'],
  passer: ['Passer', 'P'],
  finisher: ['Finisher', 'F'],
  press: ['Press', 'P'],
  cover: ['Cover', 'C'],
  mark: ['Mark', 'M'],
  zone: ['Zone', 'Z'],
  intercept: ['Intercept', 'I'],
} as const;
const ATTACKING_SET = ['smart', 'support', 'run', 'hold', 'passer', 'finisher'];
const DEFENDING_SET = ['smart', 'press', 'cover', 'mark', 'zone', 'intercept'];

describe('player roles', () => {
  it('are the app’s roles, with the app’s names and badges', () => {
    expect(Object.keys(roles)).toEqual(Object.keys(APP));
    for (const [id, [name, letter]] of Object.entries(APP)) {
      expect(en.tactics.roles[id as RoleId]).toBe(name);
      expect(roleLetters[id as RoleId]).toBe(letter);
    }
  });

  it('are grouped as in the app, and the buttons are the defending set', () => {
    expect(rolesOf('attack')).toEqual(ATTACKING_SET);
    expect(rolesOf('defence')).toEqual(DEFENDING_SET);
    expect([...ROLE_CHOICES]).toEqual(DEFENDING_SET);
  });

  it('has the same roles in both languages', () => {
    expect(Object.keys(ar.tactics.roles)).toEqual(Object.keys(roleLetters));
    expect(Object.keys(ar.tactics.try.chips)).toEqual(Object.keys(en.tactics.try.chips));
  });

  it('uses none of the old names', () => {
    for (const old of [
      'Overlap',
      'Run behind',
      'Mark a player',
      'Intercept lanes',
      'Hold position',
    ]) {
      expect(JSON.stringify(en.tactics)).not.toContain(old);
    }
  });

  it('never mentions a second cover', () => {
    expect(JSON.stringify(en)).not.toMatch(/second cover/i);
    expect(JSON.stringify(ar)).not.toMatch(/تغطية ثانية/);
  });
});
