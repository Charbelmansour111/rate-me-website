import Image from 'next/image';
import type { ReactNode } from 'react';

import { BoxCorner } from './pitch-lines';

/**
 * What a card in "What you get" shows: its photo, Coming soon where it applies, its icon, title,
 * one line and More. Rendered on the server; the carousel (feature-carousel.tsx) adds the button
 * over it and the state, so the browser has less to run when the page loads.
 */
export function FeatureCardFace({
  c,
  icon,
  more,
}: {
  c: {
    id: string;
    title: string;
    benefit: string;
    alt: string;
    src: string | null;
    soon: string | null;
  };
  icon: ReactNode;
  more: string;
}) {
  return (
    <>
      <span className="feature-photo">
        {c.src && (
          <Image
            src={c.src}
            alt={c.alt}
            fill
            sizes="(min-width: 64rem) 22rem, (min-width: 40rem) 42vw, 62vw"
            className="object-cover"
            draggable={false}
          />
        )}
        <BoxCorner />
        {c.soon && <span className="feature-soon">{c.soon}</span>}
      </span>
      <span className="feature-body">
        <span className="feature-icon">{icon}</span>
        <span id={`feature-${c.id}-title`} className="display h3 feature-title">
          {c.title}
        </span>
        <span id={`feature-${c.id}-benefit`} className="feature-benefit">
          {c.benefit}
        </span>
        <span className="feature-more">
          {more}
          <svg
            viewBox="0 0 24 24"
            className="size-4 rtl:-scale-x-100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </span>
    </>
  );
}
