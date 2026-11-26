import Image from 'next/image';

import { coaches } from '@/config/community.config';
import { features } from '@/config/features.config';
import type { Dictionary } from '@/i18n';
import { publicFile } from '@/lib/public-file';

type Community = Dictionary['community'];

/** Round black-and-white photos of coaches (src/config/community.config.ts), overlapping. */
export function CoachPhotos({ t }: { t: Community }) {
  const named = coaches.some(({ name }) => name);
  return (
    <figure data-reveal className="mt-9">
      <ul
        className="flex"
        aria-label={named ? t.coaches : undefined}
        aria-hidden={!named || undefined}
      >
        {coaches.map(({ photo, name }) => {
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

/** A made-up match request, as the app will show it: two clubs, the details and its status. */
export function MatchRequestCard({ t, soon }: { t: Community; soon: string }) {
  const m = t.match;
  const released = features.find(({ id }) => id === 'matchRequests')?.released;
  const crest = (name: string, tone: string) => (
    <span
      aria-hidden="true"
      className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold ${tone}`}
    >
      {name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)}
    </span>
  );
  return (
    <figure data-reveal className="match-card">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{m.label}</span>
        {!released && (
          <span className="rounded-full border-[1.5px] border-accent px-3 py-0.5 text-sm font-semibold text-accent-text">
            {soon}
          </span>
        )}
      </figcaption>
      <p className="mt-1 text-sm text-muted">{m.example}</p>

      <div className="mt-5 grid gap-2">
        {[
          [m.from, 'bg-accent text-brand-black'],
          [m.to, 'bg-text text-page'],
        ].map(([club, tone], i) => (
          <div key={club} className="flex items-center gap-3">
            {crest(club, tone)}
            <p className="leading-tight">
              {i === 1 && <span className="me-1.5 text-sm text-muted">{m.versus}</span>}
              <span className="font-semibold">{club}</span>
              <span className="ms-2 text-sm whitespace-nowrap text-muted">{m.team}</span>
            </p>
          </div>
        ))}
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-4 text-sm text-muted">
        <li>{m.when}</li>
        <li>{m.format}</li>
        <li>{m.where}</li>
      </ul>

      <p className="mt-4 flex justify-end">
        <span data-pop className="status-chip">
          <svg
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 8.5l3 3 7-7" />
          </svg>
          {m.status}
        </span>
      </p>
    </figure>
  );
}
