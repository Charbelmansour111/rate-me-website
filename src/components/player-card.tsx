import Image from 'next/image';
import type { CSSProperties } from 'react';

import type { Dictionary } from '@/i18n';

type Strings = Dictionary['showcase']['playerCard'];
type StatKey = keyof Strings['stats'];

/**
 * The app's player card ("ticket" design, rate-me src/features/cards/player-card.tsx), drawn in
 * HTML, CSS and SVG: one cut corner, the tier tag, the overall in a ring out of 100, the photo,
 * a perforation, the name and position, then six attributes in full words with bars. Its own
 * tier names and attribute names; no video-game card, no club or competition marks. An example:
 * a stock photo and no real name.
 */
const OVERALL = 72;
const NUMBER = 8;
const STATS: Record<StatKey, number> = {
  pace: 78,
  shooting: 64,
  passing: 81,
  dribbling: 75,
  defending: 58,
  physical: 70,
};
/** The app's look for the "regular" tier, and its midfielder colour. */
const LOOK = {
  from: '#1c1b29',
  to: '#3a1606',
  accent: '#ff7a1a',
  label: '#e6dcd2',
  chip: '#ff7a1a',
  onChip: '#1c1b29',
  position: '#22c55e',
  onPosition: '#14141a',
};
const STAT_MAX = 99;

export function PlayerCard({ t }: { t: Strings }) {
  const size = 104;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="player-card"
      role="img"
      aria-label={t.label}
      style={
        {
          '--card-from': LOOK.from,
          '--card-to': LOOK.to,
          '--card-accent': LOOK.accent,
          '--card-label': LOOK.label,
          '--card-position': LOOK.position,
        } as CSSProperties
      }
    >
      <svg
        className="player-card-ground"
        viewBox="0 0 100 140"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="player-card-ground" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={LOOK.from} />
            <stop offset="1" stopColor={LOOK.to} />
          </linearGradient>
        </defs>
        <path
          d="M0 6 Q0 0 6 0 L82 0 L100 18 L100 134 Q100 140 94 140 L6 140 Q0 140 0 134 Z"
          fill="url(#player-card-ground)"
        />
      </svg>
      <div className="player-card-body" aria-hidden="true">
        <div className="player-card-top">
          <div className="player-card-tier">
            <span
              className="player-card-chip"
              style={{ background: LOOK.chip, color: LOOK.onChip }}
            >
              {t.tier}
            </span>
            <span className="player-card-ring" style={{ width: size, height: size }}>
              <svg width={size} height={size}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke="rgb(255 255 255 / 0.16)"
                  strokeWidth={stroke}
                  fill="none"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={LOOK.accent}
                  strokeWidth={stroke}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(c * OVERALL) / 100} ${c}`}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              </svg>
              <span className="player-card-overall">
                {OVERALL}
                <small>{t.outOf}</small>
              </span>
            </span>
          </div>
          <span className="player-card-portrait" data-depth="1">
            {/* A stock photo, black and white (docs/PHOTO-CREDITS.md); its ring is the tier's
                colour, as in the app */}
            <Image
              className="player-card-photo"
              src="/cards/player.jpg"
              alt=""
              width={112}
              height={112}
              sizes="112px"
            />
            {/* The position, raised: a shadow, a white rim (the app's position tokens), the
                position colour as its face, a soft shine. It moves a little more than the card
                when it tilts (src/components/react-bits/tilted-card.motion.ts). */}
            <span className="player-card-badge" data-depth="2" style={{ color: LOOK.onPosition }}>
              {t.positionLetter}
            </span>
          </span>
        </div>
        <div className="player-card-perforation" />
        <div className="player-card-identity">
          <span className="player-card-name">{t.name}</span>
          <span className="player-card-meta">
            {t.position} · #{NUMBER}
          </span>
        </div>
        <ul className="player-card-bars">
          {(Object.keys(STATS) as StatKey[]).map((key) => (
            <li key={key}>
              <span className="player-card-stat">{t.stats[key]}</span>
              <span className="player-card-track">
                <span style={{ width: `${(STATS[key] / STAT_MAX) * 100}%` }} />
              </span>
              <span className="player-card-value">{STATS[key]}</span>
            </li>
          ))}
        </ul>
        <span className="player-card-example">{t.example}</span>
      </div>
    </div>
  );
}
