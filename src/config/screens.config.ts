import type { FeatureId } from './features.config';

/**
 * "Inside the app": which screens each view shows, in order, three at most (they stand side by
 * side on a computer, the middle one in front). A screen looks for
 * public/screens/<view>-<id>.png (or .webp, .jpg; see the README there) and draws its sketch until
 * the file exists. Captions live in src/i18n (showcase.captions).
 *
 * `feature`: shows "Coming soon" while that feature is not released (features.config.ts).
 * `kind: 'card'`: drawn as the app's player card (src/components/player-card.tsx), not a phone.
 * Each phone opens a panel with three facts about the screen (src/i18n: showcase.details).
 *
 * The three phones of a view each have their own frame, by place: black, orange in the middle
 * (with the strongest glow), white. Picked for contrast on the charcoal panel.
 */
export const looks = ['black', 'orange', 'white'] as const;
export type Look = (typeof looks)[number];

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
  kind?: 'card';
};

export const screens: Record<ViewId, Screen[]> = {
  coach: [
    { id: 'calendar', feature: 'calendar' },
    { id: 'whiteboard-roles', feature: 'whiteboard' },
    // The Coaches Channel: one space for the coaches of every club.
    { id: 'channel' },
  ],
  player: [
    { id: 'home' },
    { id: 'event', feature: 'calendar' },
    { id: 'card', feature: 'squad', kind: 'card' },
  ],
};
