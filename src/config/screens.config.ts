import type { FeatureId } from './features.config';

/**
 * "Inside the app": which screens each view shows, in order, three at most (they stand side by
 * side on a computer, the middle one in front). A screen looks for
 * public/screens/<view>-<id>.png (or .webp, .jpg; see the README there) and draws its sketch until
 * the file exists. Captions live in src/i18n (showcase.captions).
 *
 * `feature`: shows "Coming soon" while that feature is not released (features.config.ts).
 * `highlight`: the screen that gets the orange frame.
 */
export type ScreenId =
  | 'home'
  | 'calendar'
  | 'whiteboard'
  | 'whiteboard-roles'
  | 'formation'
  | 'squad'
  | 'event'
  | 'card'
  | 'channel';
export type ViewId = 'coach' | 'player';
export type Screen = {
  id: ScreenId;
  feature?: FeatureId;
  highlight?: boolean;
};

export const screens: Record<ViewId, Screen[]> = {
  coach: [
    { id: 'calendar', feature: 'calendar' },
    { id: 'whiteboard-roles', feature: 'whiteboard' },
    // The Coaches Channel: one space for the coaches of every club.
    { id: 'channel', highlight: true },
  ],
  player: [{ id: 'home' }, { id: 'event', feature: 'calendar' }, { id: 'card', feature: 'squad' }],
};
