'use client';

import { useState } from 'react';

import type { Dictionary } from '@/i18n';

import { BoxCorner } from './pitch-lines';
import { SpotlightCard } from './react-bits/spotlight-card';

type Why = Dictionary['why'];

/** A small line drawing for each card: the week, a drill, the squad. */
const DRAWINGS = [
  // A week: seven days, two of them marked
  <g key="week">
    <rect x="6" y="10" width="108" height="66" rx="8" />
    <path d="M6 28H114 M21 10V4 M99 10V4" />
    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
      <rect key={d} x={12 + d * 14.6} y="38" width="10" height="10" rx="2" />
    ))}
    <rect className="hint" x="41.2" y="38" width="10" height="10" rx="2" />
    <rect className="hint" x="85" y="38" width="10" height="10" rx="2" />
    <path d="M12 60H60" />
  </g>,
  // A drill: a half pitch, a pass and a run
  <g key="drill">
    <rect x="6" y="4" width="108" height="72" rx="4" />
    <path d="M40 4V20H80V4 M6 76A54 22 0 0 1 114 76" />
    <circle cx="30" cy="58" r="5" />
    <circle cx="86" cy="44" r="5" />
    <path className="hint" d="M35 56Q60 36 81 44 M74 39L81 44L74 49" />
  </g>,
  // A squad: three player cards
  <g key="squad">
    {[0, 1, 2].map((c) => (
      <g key={c} transform={`translate(${6 + c * 38} 8)`}>
        <rect width="32" height="66" rx="5" />
        <circle cx="16" cy="20" r="7" />
        <path d="M8 40H24 M8 48H24 M8 56H18" />
      </g>
    ))}
    <path className="hint" d="M50 15h12" />
  </g>,
];

/**
 * "Plan, build, organize": three cards that open in place for a closer look. The title is a
 * button with aria-expanded; without JavaScript every card is simply open (src/app/motion.css).
 */
export function WhyCards({ t }: { t: Why }) {
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((was) => {
      const next = new Set(was);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  return t.items.map((item, i) => {
    const expanded = open.has(i);
    return (
      <SpotlightCard key={item.title} as="li" className="why-card look-ink p-7">
        <BoxCorner className="why-corner" />
        <div data-open={expanded} className="why-item">
          <span aria-hidden="true" className="display block text-2xl text-accent-text tabular-nums">
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 className="display h3 mt-4">
            <button
              type="button"
              id={`why-q-${i}`}
              aria-expanded={expanded}
              aria-controls={`why-a-${i}`}
              onClick={() => toggle(i)}
              className="why-button"
            >
              <span className="card-title">{item.title}</span>
              <span className="faq-icon" aria-hidden="true" />
              <span className="sr-only">{t.more}</span>
            </button>
          </h3>
          <p className="mt-3 text-lg text-muted">{item.text}</p>
          <div id={`why-a-${i}`} role="region" aria-labelledby={`why-q-${i}`} className="faq-panel">
            <div className="overflow-hidden">
              <svg
                className="why-drawing chalk mt-6"
                viewBox="0 0 120 80"
                aria-hidden="true"
                fill="none"
              >
                {DRAWINGS[i]}
              </svg>
              <p className="mt-4 text-lg">{item.more}</p>
            </div>
          </div>
        </div>
      </SpotlightCard>
    );
  });
}
