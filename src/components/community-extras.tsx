import Image from 'next/image';

import { coaches } from '@/config/community.config';
import type { Dictionary } from '@/i18n';
import { publicFile } from '@/lib/public-file';

type Community = Dictionary['community'];

/** How many portraits the strip shows. */
const SHOWN = 3;

/**
 * Round black-and-white portraits (src/config/community.config.ts), overlapping: three at most, with
 * a caption that says they illustrate, so no one reads them as customers.
 */
export function CoachPhotos({ t }: { t: Community }) {
  const shown = coaches.slice(0, SHOWN);
  const named = shown.some(({ name }) => name);
  return (
    <figure data-reveal className="mt-9">
      <ul
        className="flex"
        aria-label={named ? t.coaches : undefined}
        aria-hidden={!named || undefined}
      >
        {shown.map(({ photo, name }) => {
          const src = publicFile('community', photo);
          return (
            <li key={photo} className="coach-photo">
              {src ? (
                <Image
                  src={src}
                  alt={name}
                  width={72}
                  height={72}
                  className="size-full object-cover"
                />
              ) : (
                // A silhouette holds the place until the photo is there.
                <svg data-placeholder viewBox="0 0 72 72" className="size-full" aria-hidden="true">
                  <rect width="72" height="72" fill="var(--soft)" />
                  <circle cx="36" cy="29" r="12" fill="var(--edge)" />
                  <path d="M12 72c2-15 12-23 24-23s22 8 24 23Z" fill="var(--edge)" />
                </svg>
              )}
            </li>
          );
        })}
      </ul>
      <figcaption className="mt-3 text-sm font-semibold text-muted">{t.coaches}</figcaption>
    </figure>
  );
}

/** Ionicons (MIT) paths, as the app draws them (docs/LICENSES.md). */
const ICON = {
  shield:
    'M463.1 112.37C373.68 96.33 336.71 84.45 256 48c-80.71 36.45-117.68 48.33-207.1 64.37C32.7 369.13 240.58 457.79 256 464c15.42-6.21 223.3-94.87 207.1-351.63z',
  calendar:
    'M96 80h320a48 48 0 0148 48v288a48 48 0 01-48 48H96a48 48 0 01-48-48V128a48 48 0 0148-48zM128 48v32M384 48v32M464 160H48',
  location:
    'M256 48c-79.5 0-144 61.39-144 137 0 87 96 224.87 131.25 272.49a15.77 15.77 0 0025.5 0C304 409.89 400 272.07 400 185c0-75.61-64.5-137-144-137zM256 144a48 48 0 110 96 48 48 0 010-96z',
  safety:
    'M336 176L225.2 304 176 255.8M463.1 112.37C373.68 96.33 336.71 84.45 256 48c-80.71 36.45-117.68 48.33-207.1 64.37C32.7 369.13 240.58 457.79 256 464c15.42-6.21 223.3-94.87 207.1-351.63z',
};

/** checkmark-circle (filled): the verified mark next to a team's name. */
const CHECK_FILLED =
  'M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm108.25 138.29l-134.4 160a16 16 0 01-12 5.71h-.27a16 16 0 01-11.89-5.3l-57.6-64a16 16 0 1123.78-21.4l45.29 50.32 122.59-145.91a16 16 0 0124.5 20.58z';

function Icon({ d, className = 'size-4' }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * A match request as the app shows it (rate-me: app/(app)/friendlies/[id].tsx and
 * features/friendlies/friendly-ui.tsx), in this site's colours: the other team with its shield
 * tile, the status chip and the counters left, their proposal (when, where), Accept, Counter and
 * Decline, and the app's safety line. An example: made-up teams. A picture of the app, so its
 * buttons are drawn, not real; screen readers get one description.
 */
export function MatchRequestCard({ t }: { t: Community }) {
  const m = t.match;
  return (
    <figure data-reveal className="match-card look-paper" role="img" aria-label={m.description}>
      <div aria-hidden="true">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-muted">{m.label}</span>
          <span className="match-example">{m.example}</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="match-tile">
            <Icon d={ICON.shield} className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1 font-bold">
              {m.team}
              <svg viewBox="0 0 512 512" className="match-verified size-4" aria-hidden="true">
                <path d={CHECK_FILLED} fill="currentColor" />
              </svg>
            </span>
            <span className="block text-sm text-muted">{m.meta}</span>
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="match-chip">{m.status}</span>
          <span className="text-sm text-muted">{m.counters}</span>
        </div>
        <div className="match-proposal mt-4">
          <span className="text-sm font-bold text-accent-text">{m.caption}</span>
          <span className="match-line font-bold">
            <Icon d={ICON.calendar} />
            {m.when}
          </span>
          <span className="match-line">
            <Icon d={ICON.location} />
            {m.where}
          </span>
        </div>
        <span className="match-accept mt-4">{m.accept}</span>
        <span className="mt-1 flex justify-center gap-6">
          <span className="match-text-action">{m.counter}</span>
          <span className="match-text-action">{m.decline}</span>
        </span>
        <span className="match-safety mt-3">
          <Icon d={ICON.safety} />
          {m.safety}
        </span>
      </div>
    </figure>
  );
}
