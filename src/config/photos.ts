/**
 * Every photograph on the site: whether a face is visible, and its tone. The rule (WEBSITE 17): a
 * photo with a visible face is black and white. A photo with no face keeps its colour, with one
 * exception (WEBSITE 19): every photo on a "What you get" card is black and white, so the cards
 * read as one set (a blue sky behind the goal net clashed with the site). tests/unit/photos.test.ts
 * checks each file against this list; credits are in docs/PHOTO-CREDITS.md. App screens are not
 * photos (src/config/app-shots.ts): they stay as the app shows them.
 */
export type Photo = { file: string; faces: boolean; tone: 'grey' | 'colour'; what: string };

export const photos: Photo[] = [
  // Faces: always black and white
  { file: 'public/community/coach-1.jpg', faces: true, tone: 'grey', what: 'portrait' },
  { file: 'public/community/coach-2.jpg', faces: true, tone: 'grey', what: 'portrait' },
  { file: 'public/community/coach-3.jpg', faces: true, tone: 'grey', what: 'portrait' },
  { file: 'public/community/coach-4.jpg', faces: true, tone: 'grey', what: 'portrait (not shown)' },
  { file: 'public/community/coach-5.jpg', faces: true, tone: 'grey', what: 'portrait (not shown)' },
  { file: 'public/community/coach-6.jpg', faces: true, tone: 'grey', what: 'portrait (not shown)' },
  { file: 'public/community/coach-7.jpg', faces: true, tone: 'grey', what: 'portrait (not shown)' },
  { file: 'public/community/coach-8.jpg', faces: true, tone: 'grey', what: 'portrait (not shown)' },
  {
    file: 'public/cards/player.jpg',
    faces: true,
    tone: 'grey',
    what: 'portrait on the example card',
  },
  {
    file: 'public/features/tournaments.webp',
    faces: true,
    tone: 'grey',
    what: 'a squad lifting a trophy, every mark blurred',
  },
  // The feature cards: black and white, face or not
  {
    file: 'public/features/calendar.webp',
    faces: false,
    tone: 'grey',
    what: 'legs and boots at a cone',
  },
  { file: 'public/features/whiteboard.webp', faces: false, tone: 'grey', what: 'a tactics board' },
  { file: 'public/features/matchRequests.webp', faces: false, tone: 'grey', what: 'a goal net' },
  {
    file: 'public/features/assistant.webp',
    faces: false,
    tone: 'grey',
    what: 'a training sheet in two hands',
  },
  // No face, outside the cards: colour
  {
    file: 'public/community/players.webp',
    faces: false,
    tone: 'colour',
    what: 'players from behind',
  },
  { file: 'public/footer/pitch.webp', faces: false, tone: 'colour', what: 'turf, legs and balls' },
];
