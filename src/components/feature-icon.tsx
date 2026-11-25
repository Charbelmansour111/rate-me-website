import type { FeatureId } from '@/config/features.config';

/** Line icons drawn for this site on a 48 grid, in the same stroke as the pitch markings. */
const paths: Record<FeatureId, string> = {
  calendar: 'M8 12h32v28H8Z M8 20h32 M16 7v8 M32 7v8 M15 27h4 M15 33h4 M27 30l3 3 6-6',
  whiteboard:
    'M6 9h36v24H6Z M18 41l6-8 6 8 M13 27c4-9 9-9 13-5 M22 22h4v-4 M32 15l5 5 M37 15l-5 5 M11 15h.01',
  squad: 'M12 6h24v36H12Z M24 13a5 5 0 1 1 0 10a5 5 0 0 1 0-10 M17 33c1-6 13-6 14 0 M18 38h12',
  matchRequests:
    'M6 14l9-5 4 5-1 22H8L7 21Z M42 14l-9-5-4 5 1 22h10l1-15Z M21 22h6l-2-2 M27 28h-6l2 2',
  tournaments:
    'M15 8h18v10a9 9 0 0 1-18 0Z M15 11H8c0 7 3 9 7 9 M33 11h7c0 7-3 9-7 9 M24 27v8 M16 41h16 M19 41c0-4 2-6 5-6s5 2 5 6',
  assistant: 'M8 9h32v24H24l-9 8v-8H8Z M16 18h16 M16 25h9',
};

export function FeatureIcon({ id }: { id: FeatureId }) {
  return (
    <span className="grid size-14 place-items-center rounded-full bg-tint">
      <svg
        viewBox="0 0 48 48"
        className="size-8 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={paths[id]} />
      </svg>
    </span>
  );
}
