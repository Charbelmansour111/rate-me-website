/**
 * Example roles in the tactics section, named as in the app (role-model.ts there). The letter is
 * the app's badge: the first letter of the English name, in Arabic too, as the board is in English.
 * Names live in src/i18n (tactics.roles).
 */
export const roleLetters = {
  press: 'P',
  cover: 'C',
  mark: 'M',
  overlap: 'O',
  run_behind: 'R',
  intercept: 'I',
} as const;
export type RoleId = keyof typeof roleLetters;
