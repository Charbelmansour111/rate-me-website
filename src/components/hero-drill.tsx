'use client';

import { useState } from 'react';

import type { Dictionary } from '@/i18n';

const PASSES = [
  'M84 318 L186 396',
  'M186 396 L312 372',
  'M312 372 L402 250',
  // The shot
  'M402 250 Q340 120 268 40',
];
const ATTACKERS = [
  [62, 306],
  [172, 420],
  [322, 396],
];

/** An original drill on a half pitch. Runs once, then rests on the finished diagram. */
export function HeroDrill({ t }: { t: Dictionary['hero']['drill'] }) {
  const [run, setRun] = useState(0);
  return (
    <figure className="relative" dir="ltr">
      <svg
        key={run}
        viewBox="0 0 480 500"
        role="img"
        aria-label={t.alt}
        className="h-auto w-full"
        fill="none"
      >
        {/* Half pitch */}
        <g stroke="var(--chalk)" strokeWidth="2">
          <path d="M16 32 H464 V484 H16 Z" />
          <path d="M112 32 V142 H368 V32 M178 32 V72 H302 V32" />
          <path d="M194 142 A52 52 0 0 0 286 142" />
          <path d="M184 484 A56 56 0 0 1 296 484" />
          <path d="M16 46 A14 14 0 0 0 30 32 M450 32 A14 14 0 0 0 464 46" />
        </g>
        <path d="M202 32 V12 H278 V32" stroke="var(--text)" strokeWidth="4" />
        <circle cx="240" cy="110" r="3" fill="var(--chalk)" />

        {PASSES.map((d, i) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            stroke={i === 3 ? 'var(--accent)' : 'var(--muted)'}
            strokeWidth={i === 3 ? 5 : 3}
            strokeLinecap="round"
            className={`drill-pass drill-p${i + 1}`}
          />
        ))}

        {/* Defenders: outlined. Attackers: filled. Orange is for the ball and the shot. */}
        {[1, 2, 3].map((n) => (
          <g key={n} className={`drill-mover drill-d${n}`}>
            <circle r="17" fill="var(--page)" stroke="var(--text)" strokeWidth="3" />
            <path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="var(--text)" strokeWidth="3" />
          </g>
        ))}
        {ATTACKERS.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="18" fill="var(--text)" />
        ))}
        <circle r="18" fill="var(--text)" className="drill-mover drill-a4" />

        <g className="drill-mover drill-ball">
          <circle r="10" fill="var(--brand-orange)" stroke="var(--brand-black)" strokeWidth="2" />
          <path d="M0 -4.5 L4.3 -1.4 L2.6 3.6 L-2.6 3.6 L-4.3 -1.4 Z" fill="var(--brand-black)" />
        </g>
      </svg>
      <figcaption
        className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted"
        dir="auto"
      >
        <span>{t.caption}</span>
        <button
          type="button"
          onClick={() => setRun((n) => n + 1)}
          className="link min-h-11 px-1 font-semibold motion-reduce:hidden"
        >
          {t.replay}
        </button>
      </figcaption>
    </figure>
  );
}
