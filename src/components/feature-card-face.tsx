import Image from 'next/image';
import type { ReactNode } from 'react';

import type { AppShot } from '@/config/app-shots';

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
    shot: AppShot | null;
    soon: string | null;
    example: string | null;
  };
  icon: ReactNode;
  more: string;
}) {
  return (
    <>
      <span className="feature-photo" data-frame={c.shot?.frame}>
        {c.shot?.face && c.shot.frame === 'paper' ? (
          // The report is a PDF: its first page lies as a sheet of paper, running off the bottom
          <span className="feature-sheet">
            <Image
              src={c.shot.face.src}
              alt={c.alt}
              width={c.shot.face.width}
              height={c.shot.face.height}
              sizes="(min-width: 64rem) 18rem, (min-width: 40rem) 35vw, 52vw"
              className="block h-auto w-full"
              draggable={false}
            />
          </span>
        ) : c.shot?.face ? (
          // An app screen, cut to 16:10 in the file itself, so every width shows the same part
          <Image
            src={c.shot.face.src}
            alt={c.alt}
            width={c.shot.face.width}
            height={c.shot.face.height}
            sizes="(min-width: 64rem) 22rem, (min-width: 40rem) 42vw, 62vw"
            className="absolute inset-0 size-full object-cover"
            draggable={false}
          />
        ) : (
          c.src && (
            <Image
              src={c.src}
              alt={c.alt}
              fill
              sizes="(min-width: 64rem) 22rem, (min-width: 40rem) 42vw, 62vw"
              className="object-cover"
              draggable={false}
            />
          )
        )}
        <BoxCorner />
        {c.soon && <span className="feature-soon">{c.soon}</span>}
      </span>
      <span className="feature-body">
        <span className="feature-icon">{icon}</span>
        {/* Example sits on the More line, off the picture (src/app/journey.css) */}
        {c.example && c.shot?.face && <span className="feature-example">{c.example}</span>}
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
