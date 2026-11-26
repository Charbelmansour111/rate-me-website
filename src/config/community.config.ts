/**
 * The people pictured in the community section: a strip of up to eight. Each photo is
 * public/community/<photo>.webp (or .jpg, .png), square, at least 256 x 256; it shows in black and
 * white. Until a file is there a drawn silhouette holds its place.
 *
 * The photos now are stock portraits from Unsplash (docs/PHOTO-CREDITS.md), not coaches of Rate
 * Me: so no names, quotes or claims go with them, and the caption says nothing about who they are.
 *
 * `name`: the coach's name, read out to screen readers. Leave it empty for stock photos, and only
 * add real coaches who agreed to be shown.
 */
export const coaches: { photo: string; name: string }[] = [
  { photo: 'coach-1', name: '' },
  { photo: 'coach-2', name: '' },
  { photo: 'coach-3', name: '' },
  { photo: 'coach-4', name: '' },
  { photo: 'coach-5', name: '' },
  { photo: 'coach-6', name: '' },
  { photo: 'coach-7', name: '' },
  { photo: 'coach-8', name: '' },
];
