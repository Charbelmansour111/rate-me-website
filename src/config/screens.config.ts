import type { FeatureId } from './features.config';

/**
 * "Inside the app": which screens each view shows, in order. A screen looks for
 * public/screens/<view>-<id>.png (or .webp, .jpg; see the README there) and draws its sketch until
 * the file exists. Captions live in src/i18n (showcase.captions).
 *
 * `feature`: shows "Coming soon" while that feature is not released (features.config.ts).
 * `released: false`: shows "Coming soon" for a screen that is not a feature of its own.
 * `highlight`: the screen that gets the orange frame.
 */
export type ScreenId = 'home' | 'calendar' | 'whiteboard' | 'squad' | 'event' | 'card' | 'channel';
export type ViewId = 'coach' | 'player';
export type Screen = {
  id: ScreenId;
  feature?: FeatureId;
  released?: boolean;
  highlight?: boolean;
};

export const screens: Record<ViewId, Screen[]> = {
  coach: [
    { id: 'home' },
    { id: 'calendar', feature: 'calendar' },
    { id: 'whiteboard', feature: 'whiteboard' },
    { id: 'squad', feature: 'squad' },
    // The Coaches Channel: one space for the coaches of every club.
    { id: 'channel', highlight: true },
  ],
  player: [
    { id: 'home' },
    { id: 'event', feature: 'calendar' },
    { id: 'card', feature: 'squad' },
    // Not in the app yet: players get messages from their coach, but have no channel.
    { id: 'channel', highlight: true, released: false },
  ],
};
