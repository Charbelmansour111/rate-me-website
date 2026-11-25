/** Simple line icons, drawn here in the site's own stroke; the link carries the name. */
const paths: Record<string, string> = {
  Instagram:
    'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8 M17 7h.01',
  Facebook: 'M17 3h-2a4 4 0 0 0-4 4v14 M7 12h8',
  TikTok: 'M13 3v12a4 4 0 1 1-4-4 M13 3c0 3 2 5 5 5',
  YouTube:
    'M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z M10 9.500l5 2.500-5 2.500Z',
  LinkedIn: 'M5 10v9 M5 5h.01 M10 19v-9 M10 14a4 4 0 0 1 9 0v5',
  X: 'M5 4l14 16 M19 4L5 20',
};

export function SocialIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
