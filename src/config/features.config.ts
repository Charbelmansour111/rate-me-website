/**
 * The features grid. Flip `released` to true to remove a "Coming soon" tag.
 * Titles and descriptions live in src/i18n (features.items).
 */
export const features = [
  { id: 'calendar', released: true },
  { id: 'whiteboard', released: true },
  { id: 'squad', released: true },
  { id: 'matchRequests', released: false },
  { id: 'tournaments', released: false },
  { id: 'assistant', released: false },
] as const;

export type FeatureId = (typeof features)[number]['id'];
