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

/**
 * A match request as the app shows it: a screenshot of the Coaches Channel (own work, Rate Me),
 * the request card only, with no team or coach name. Sample data, so it says "Example".
 */
export function MatchRequestCard({ t }: { t: Community }) {
  const m = t.match;
  return (
    <figure data-reveal className="match-card look-paper">
      <figcaption className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-muted">{m.label}</span>
        <span className="match-example">{m.example}</span>
      </figcaption>
      <Image
        src="/community/match-request.webp"
        alt={m.alt}
        width={960}
        height={527}
        sizes="(min-width: 64rem) 28rem, 90vw"
        className="mt-3 h-auto w-full rounded-xl"
      />
    </figure>
  );
}

/**
 * Atmosphere: three players walking out, from behind (Unsplash, docs/PHOTO-CREDITS.md), in black
 * and white. Not our players or our club; no names go with it.
 */
export function PlayersPhoto({ alt }: { alt: string }) {
  return (
    <Image
      data-reveal
      src="/community/players.webp"
      alt={alt}
      width={1000}
      height={750}
      sizes="(min-width: 64rem) 30rem, 90vw"
      className="community-photo"
    />
  );
}
