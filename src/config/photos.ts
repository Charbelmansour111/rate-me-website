/**
 * Every photograph on the site, and whether a face shows in it (WEBSITE 17, the colour rule): a
 * photo where a face is visible is black and white; one with no visible face (from behind, legs,
 * boots, the ball, grass, cones, a goal, a net, equipment) stays in colour. tests/unit/photos.test.ts
 * checks each file against this list; credits are in docs/PHOTO-CREDITS.md. App screens are not
 * photos (src/config/app-shots.ts): they stay as the app shows them.
 */
export type Photo = { file: string; faces: boolean; what: string };

export const photos: Photo[] = [
  // Faces: black and white
  { file: 'public/community/coach-1.jpg', faces: true, what: 'portrait' },
  { file: 'public/community/coach-2.jpg', faces: true, what: 'portrait' },
  { file: 'public/community/coach-3.jpg', faces: true, what: 'portrait' },
  { file: 'public/community/coach-4.jpg', faces: true, what: 'portrait (not shown)' },
  { file: 'public/community/coach-5.jpg', faces: true, what: 'portrait (not shown)' },
  { file: 'public/community/coach-6.jpg', faces: true, what: 'portrait (not shown)' },
  { file: 'public/community/coach-7.jpg', faces: true, what: 'portrait (not shown)' },
  { file: 'public/community/coach-8.jpg', faces: true, what: 'portrait (not shown)' },
  { file: 'public/cards/player.jpg', faces: true, what: 'portrait on the example card' },
  // No face: colour
  { file: 'public/features/calendar.webp', faces: false, what: 'legs and boots at a cone' },
  { file: 'public/features/whiteboard.webp', faces: false, what: 'a tactics board' },
  { file: 'public/features/tournaments.webp', faces: false, what: 'a goal net' },
  { file: 'public/community/players.webp', faces: false, what: 'players from behind' },
  { file: 'public/footer/pitch.webp', faces: false, what: 'turf, legs and balls' },
  { file: 'public/features/assistant.webp', faces: false, what: 'a training sheet in two hands' },
];
