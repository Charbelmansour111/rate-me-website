/**
 * The coaches pictured in the community section, three or four. Each photo is
 * public/community/<photo>.webp (or .jpg, .png), square, at least 256 x 256; it shows in black and
 * white. Until a file is there a drawn silhouette holds its place.
 *
 * `name`: the coach's name, read out to screen readers. Leave it empty while the photo is a
 * placeholder, and only add real coaches who agreed to be shown.
 */
export const coaches: { photo: string; name: string }[] = [
  { photo: 'coach-1', name: '' },
  { photo: 'coach-2', name: '' },
  { photo: 'coach-3', name: '' },
  { photo: 'coach-4', name: '' },
];
