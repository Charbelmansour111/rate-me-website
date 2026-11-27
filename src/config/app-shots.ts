import type { FeatureId } from './features.config';

/** A picture file in public/, with its size in pixels (set on the <img>, so nothing jumps). */
export type Shot = { src: string; width: number; height: number };

/**
 * The feature cards that show the app's own screens, with demo data (WEBSITE 18). Made from the
 * clean captures in site-assets/screens/app (not committed); credited in docs/PHOTO-CREDITS.md.
 *
 * - `face`: the card's 16:10 picture, cut so it reads at card size.
 * - `pages`: what the dialog shows whole. `phone`: the screen in the site's phone frame
 *   (src/components/phone-frame.tsx). `paper`: the monthly report is a PDF, so its pages lie as
 *   paper, never in a phone.
 */
export type AppShot = { frame: 'phone' | 'paper'; face: Shot; pages: Shot[] };

export const appShots: Partial<Record<FeatureId, AppShot>> = {
  // The face: the player card's shield alone. The dialog: the Squad list, keepers first, seven
  // whole rows (cut under the seventh, above the tab bar)
  squad: {
    frame: 'phone',
    face: { src: '/features/squad.webp', width: 800, height: 500 },
    pages: [{ src: '/features/squad-detail.webp', width: 780, height: 1492 }],
  },
  // The face: the top of the report's first page. The dialog: both pages
  parentReport: {
    frame: 'paper',
    face: { src: '/features/parentReport.webp', width: 640, height: 678 },
    pages: [
      { src: '/features/parentReport-detail.webp', width: 780, height: 1380 },
      { src: '/features/parentReport-detail-2.webp', width: 780, height: 1640 },
    ],
  },
  // The face: a request received, their proposal and the three answers. The dialog: the
  // Coaches Channel with a friendly request in it
  matchRequests: {
    frame: 'phone',
    face: { src: '/features/matchRequests.webp', width: 800, height: 500 },
    pages: [{ src: '/features/matchRequests-detail.webp', width: 780, height: 1688 }],
  },
};
