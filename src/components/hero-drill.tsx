import { getDictionary, type Locale } from '@/i18n';
import { buildPlay, passPath } from '@/motion/play-engine';
import { PLAYER_IDS, PLAYS } from '@/motion/plays';
import { mirror, translate } from '@/motion/tactics-data';

const LABELS = ['6', '8', '10', '7'];

/** The first play as a finished drawing; src/motion/hero.ts then runs all of them in turn. */
export function HeroDrill({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).hero.drill;
  const rtl = locale === 'ar';
  const first = buildPlay(PLAYS[0]);
  const slots = Math.max(...PLAYS.map((play) => buildPlay(play).passes.length));
  return (
    <figure data-hero-drill data-plays={JSON.stringify(t.plays)}>
      <svg
        viewBox="0 0 480 420"
        role="img"
        aria-label={t.alt}
        className="block h-auto w-full"
        fill="none"
      >
        <g stroke="var(--chalk)" strokeWidth="2">
          <path d="M14 30H466V406H14Z M120 30V126H360V30 M184 30V66H296V30" />
          <path d="M194 126A52 52 0 0 0 286 126 M184 406A56 56 0 0 1 296 406" />
          <path d="M14 44A14 14 0 0 0 28 30 M452 30A14 14 0 0 0 466 44" />
        </g>
        <path d="M204 30V12H276V30" stroke="var(--text)" strokeWidth="4" />
        {Array.from({ length: slots }, (_, i) => (
          <path
            key={i}
            data-play-trail
            d={first.passes[i] ? passPath(first.passes[i], rtl) : ''}
            pathLength={1}
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        ))}
        {PLAYER_IDS.map((id) => (
          <g
            key={id}
            data-player={id}
            style={{ transform: translate(mirror(PLAYS[0].start[id], rtl)) }}
          >
            {id.startsWith('a') ? (
              <>
                <circle r="17" fill="var(--text)" />
                <text y="5.5" textAnchor="middle" fill="var(--page)" fontSize="16" fontWeight="600">
                  {LABELS[Number(id[1])]}
                </text>
              </>
            ) : (
              <>
                <circle r="16" fill="var(--page)" stroke="var(--text)" strokeWidth="3" />
                <path d="M-5 -5L5 5M5 -5L-5 5" stroke="var(--text)" strokeWidth="3" />
              </>
            )}
          </g>
        ))}
        <g data-play-ball style={{ transform: translate(mirror(first.ball[0].point, rtl)) }}>
          <circle r="9" fill="var(--brand-orange)" stroke="var(--brand-black)" strokeWidth="2" />
          <path d="M0 -4L3.8 -1.2L2.4 3.2H-2.4L-3.8 -1.2Z" fill="var(--brand-black)" />
        </g>
      </svg>
      <figcaption className="mt-2 flex min-h-11 items-center justify-between gap-3 text-sm text-muted">
        <span data-play-name>{t.plays[0]}</span>
        <button
          type="button"
          hidden
          data-play-pause
          aria-pressed="false"
          className="link min-h-11 px-1 font-semibold"
        >
          {t.pause}
        </button>
      </figcaption>
    </figure>
  );
}
