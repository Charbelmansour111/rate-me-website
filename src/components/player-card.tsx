import Image from 'next/image';
import type { CSSProperties } from 'react';

import type { Dictionary } from '@/i18n';

import { TiltedCard } from './react-bits/tilted-card';

type Strings = Dictionary['showcase']['playerCard'];
type StatKey = keyof Strings['stats'];

/**
 * The app's shield card (rate-me: features/cards/shield-card.tsx), the one a coach sees on opening
 * a player: a crest with its shoulders cut and its sides narrowing to a point, an inner outline,
 * the overall and the position big on the left with the kit number and the tier, the photo on the
 * right, the name on a band, then six attributes in two columns with three-letter codes. Its own
 * tier and attribute names, no other game's artwork, no club or competition marks. An example: a
 * stock photo and no real name. Shown whole; the badge and the photo stand off the card when it
 * tilts (`data-depth`, src/components/react-bits/tilted-card.motion.ts).
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
/** The app's codes: the first three letters of its short names (Speed, Finishing, Vision...). */
const CODES: Record<StatKey, string> = {
  pace: 'SPE',
  shooting: 'FIN',
  passing: 'VIS',
  dribbling: 'CON',
  defending: 'TAC',
  physical: 'STR',
};
/** The app's look for the "regular" tier (rate-me: theme/domain.ts, cardLook). */
const LOOK = {
  from: '#1c1b29',
  to: '#3a1606',
  accent: '#ff7a1a',
  label: '#e6dcd2',
  line: 'rgb(255 255 255 / 0.28)',
};
const CREST =
  'M14 0 L86 0 L100 10 L100 104 Q100 112 93 116 L54 138 Q50 140 46 138 L7 116 Q0 112 0 104 L0 10 Z';
const OUTLINE =
  'M16 4 L84 4 L96 12 L96 103 Q96 109 91 112 L53 133 Q50 135 47 133 L9 112 Q4 109 4 103 L4 12 Z';

export function PlayerCard({ t }: { t: Strings }) {
  const keys = Object.keys(STATS) as StatKey[];
  const columns = [keys.slice(0, 3), keys.slice(3, 6)];
  return (
    <figure className="shield-wrap">
      {/* React Bits TiltedCard: the card leans to the mouse, its caption stays put */}
      <TiltedCard className="card-tilt">
        <div
          className="shield-card"
          role="img"
          aria-label={t.label}
          style={
            {
              '--card-accent': LOOK.accent,
              '--card-label': LOOK.label,
              '--card-line': LOOK.line,
            } as CSSProperties
          }
        >
          <svg
            className="shield-ground"
            viewBox="0 0 100 140"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="shield-regular" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0" stopColor={LOOK.from} />
                <stop offset="1" stopColor={LOOK.to} />
              </linearGradient>
            </defs>
            <path d={CREST} fill="url(#shield-regular)" />
            <path d={OUTLINE} fill="none" stroke={LOOK.line} strokeWidth="0.7" />
          </svg>
          <div className="shield-body" aria-hidden="true">
            <div className="shield-top">
              <div className="shield-badge" data-depth="2">
                <span className="shield-overall">{OVERALL}</span>
                <span className="shield-position">{t.positionCode}</span>
                <span className="shield-rule" />
                <span className="shield-kit">#{NUMBER}</span>
                <span className="shield-tier">{t.tier}</span>
              </div>
              {/* A stock photo, black and white (docs/PHOTO-CREDITS.md) */}
              <span className="shield-photo" data-depth="1">
                <Image src="/cards/player.jpg" alt="" width={140} height={140} sizes="140px" />
              </span>
            </div>
            <div className="shield-band">
              <span>{t.name}</span>
            </div>
            <div className="shield-stats">
              {columns.map((column, c) => (
                <ul key={c} className="shield-column">
                  {column.map((key) => (
                    <li key={key}>
                      <b>{STATS[key]}</b>
                      <span>{CODES[key]}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </TiltedCard>
      <figcaption className="shield-example">{t.example}</figcaption>
    </figure>
  );
}
