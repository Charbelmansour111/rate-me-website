import { describe, expect, it } from 'vitest';

import { roleLetters, type RoleId } from '@/config/roles.config';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';

/** Every role the app has (role-model.ts there). */
const APP_ROLES = [
  ...['Hold position', 'Press', 'Cover', 'Mark a player', 'Drop back', 'Track the runner'],
  ...['Intercept lanes', 'Block the shot'],
  ...['Stay in position', 'Overlap', 'Open a pass', 'Run behind', 'Cut inside', 'Come short'],
  'Support',
];

describe('player roles', () => {
  it('names only roles the app has, with the app’s letters', () => {
    for (const [id, letter] of Object.entries(roleLetters)) {
      const name = en.tactics.roles[id as RoleId];
      expect(APP_ROLES).toContain(name);
      expect(letter).toBe(name[0]);
    }
  });

  it('has the same roles in both languages', () => {
    expect(Object.keys(en.tactics.roles)).toEqual(Object.keys(roleLetters));
    expect(Object.keys(ar.tactics.roles)).toEqual(Object.keys(roleLetters));
  });

  it('never mentions a second cover', () => {
    expect(JSON.stringify(en)).not.toMatch(/second cover/i);
    expect(JSON.stringify(ar)).not.toMatch(/تغطية ثانية/);
  });
});
