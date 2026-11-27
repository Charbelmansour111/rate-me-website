import type { AppTab } from '@/components/app-tab-bar';

import type { FeatureId } from './features.config';

/**
 * "Inside the app": which screens each view shows, in order, three at most (they stand side by
 * side on a computer, the middle one in front). A screen looks for
 * public/screens/<view>-<id>.webp (or .png, .jpg; see the README there) and draws its sketch until
 * the file exists. Captions live in src/i18n (showcase.captions).
 *
 * `feature`: shows "Coming soon" while that feature is not released (features.config.ts).
 * `example`: the screen shows sample data, and says so under its phone.
 * Each phone opens a panel with three facts about the screen (src/i18n: showcase.details).
 *
 * `tab`: the app's bottom tab bar is drawn over the screenshot's own, with this tab chosen
 * (src/components/app-tab-bar.tsx). Only on screens where the app shows the bar: the whiteboard,
 * the Coaches Channel and an event open on top of the tabs, without it.
 * `dark`: the status bar above the screen is dark (the screen's own top is dark).
 *
 * Every phone has the same ink frame (src/components/phone-frame.tsx); the glow behind it is
 * orange for the middle one, the strongest.
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
  | 'match';
export type ViewId = 'coach' | 'player';
export type Screen = {
  id: ScreenId;
  feature?: FeatureId;
  example?: true;
  tab?: AppTab;
  dark?: true;
};

export const screens: Record<ViewId, Screen[]> = {
  coach: [
    // The app's own screens with demo data (WEBSITE 18); they draw their own tab bar
    { id: 'calendar', feature: 'calendar' },
    { id: 'whiteboard-roles', feature: 'whiteboard', dark: true },
    // A match request received: their proposal, then Accept, Counter or Decline
    { id: 'match', feature: 'matchRequests' },
  ],
  player: [
    { id: 'home', tab: 'home' },
    { id: 'event', feature: 'calendar' },
    // The player's card, as the app shows it (WEBSITE 20: the drawn card is gone)
    { id: 'card', feature: 'squad', dark: true, example: true },
  ],
};
