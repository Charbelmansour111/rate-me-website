import Image from 'next/image';

import { coaches } from '@/config/community.config';
import type { Dictionary } from '@/i18n';
import { publicFile } from '@/lib/public-file';

import { PhoneFrame } from './phone-frame';

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
 * Match requests as they are in the app: its own demo screens in the site's one phone frame
 * (src/components/phone-frame.tsx), as in "Inside the app". In front, a request received (Accept,
 * Counter, Decline); behind it, offset to the far side, the Coaches Channel with a request sent.
 * "Example" goes under the phones, never on them. The screens are of the app in English; the
 * Arabic page says so.
 */
export function MatchRequestPhones({ t, inEnglish }: { t: Community; inEnglish: string }) {
  const m = t.match;
  return (
    <figure data-reveal className="match-phones">
      <div className="match-phones-stage">
        <div className="match-phone-back">
          <PhoneFrame>
            <Image
              src="/features/matchRequests-detail.webp"
              alt={m.sentAlt}
              width={780}
              height={1688}
              sizes="(min-width: 64rem) 12rem, 38vw"
              className="block h-auto w-full"
            />
          </PhoneFrame>
        </div>
        <div className="match-phone-front">
          <PhoneFrame>
            <Image
              src="/screens/coach-match.webp"
              alt={m.receivedAlt}
              width={780}
              height={1688}
              sizes="(min-width: 64rem) 14rem, 44vw"
              className="block h-auto w-full"
            />
          </PhoneFrame>
        </div>
      </div>
      <figcaption className="match-caption">
        <span className="match-example">{m.example}</span>
        <span>{m.label}</span>
        {inEnglish && <span className="basis-full">{inEnglish}</span>}
      </figcaption>
    </figure>
  );
}

/**
 * Atmosphere: three players walking out, from behind (Unsplash, docs/PHOTO-CREDITS.md), in colour
 * (no face shows, src/config/photos.ts). Not our players or our club; no names go with it.
 */
export function PlayersPhoto({ alt }: { alt: string }) {
  return (
    <Image
      data-reveal
      src="/community/players.webp"
      alt={alt}
      width={960}
      height={720}
      sizes="(min-width: 64rem) 30rem, 90vw"
      className="community-photo"
    />
  );
}
