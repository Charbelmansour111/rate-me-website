/**
 * The roles in the tactics section, as the app names them (rate-me: drill-board/roles-v2/catalog.ts,
 * "whiteboard roles v2"): six for when we have the ball and six for when they have it, Smart in both
 * (ATTACKING_SET and DEFENDING_SET there). The letter is
 * the app's badge on the player: one Latin letter, the same on English and Arabic boards, as in the
 * app (so Passer and Press are both P). Names live in src/i18n (tactics.roles).
 */
export const roles = {
  smart: { letter: 'S', family: 'both' },
  support: { letter: 'U', family: 'attack' },
  run: { letter: 'R', family: 'attack' },
  hold: { letter: 'H', family: 'attack' },
  passer: { letter: 'P', family: 'attack' },
  finisher: { letter: 'F', family: 'attack' },
  press: { letter: 'P', family: 'defence' },
  cover: { letter: 'C', family: 'defence' },
  mark: { letter: 'M', family: 'defence' },
  zone: { letter: 'Z', family: 'defence' },
  intercept: { letter: 'I', family: 'defence' },
} as const;
export type RoleId = keyof typeof roles;
export type RoleFamily = 'attack' | 'defence';

export const roleLetters = Object.fromEntries(
  Object.entries(roles).map(([id, { letter }]) => [id, letter]),
) as Record<RoleId, string>;

/** The roles of a family, in the app's order. */
export const rolesOf = (family: RoleFamily) =>
  (Object.keys(roles) as RoleId[]).filter((id) => [family, 'both'].includes(roles[id].family));
