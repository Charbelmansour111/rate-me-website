import type { CSSProperties } from 'react';

import { features } from '@/config/features.config';
import { getDictionary, type Locale } from '@/i18n';
import { ATTACKERS, DEFENDERS, mirror, PASSES, translate, type Point } from '@/motion/tactics-data';

import { EdgeLine } from './edge-line';

/**
 * "Tactics that move". The server renders the finished frame with every label; src/motion plays it.
 * Decorative: the picture is hidden from assistive tech, a sentence describes it instead.
 */
export function TacticsSection({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const rtl = locale === 'ar';
  const place = (point: Point) => translate(mirror(point, rtl));
  const xy = (point: Point) => mirror(point, rtl).join(' ');
  const drift = ([x, y]: Point, order: number) =>
    ({ '--dx': `${rtl ? -x : x}px`, '--dy': `${y}px`, '--order': order }) as CSSProperties;
  const released = features.find(({ id }) => id === 'whiteboard')?.released;

  return (
    <section
      id="tactics"
      data-tactics
      className="tactics relative bg-soft"
      aria-labelledby="tactics-title"
    >
      <EdgeLine />
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          data-marker
          className="tactics-marker"
          style={{ '--i': i } as CSSProperties}
        />
      ))}
      <div className="tactics-pin">
        <div className="wrap grid items-center gap-x-14 gap-y-10 lg:grid-cols-[1fr_1.25fr]">
          <div>
            <p data-reveal className="kicker">
              {t.tactics.kicker}
            </p>
            <h2 data-reveal id="tactics-title" className="display h2">
              {t.tactics.title}
            </h2>
            {!released && (
              <p className="mt-4">
                <span className="rounded-full border-[1.5px] border-accent bg-tint px-3 py-0.5 text-sm font-semibold text-accent-text">
                  {t.features.soon}
                </span>
              </p>
            )}
            <ol className="mt-8 grid gap-4">
              {t.tactics.steps.map((step) => (
                <li key={step.title} data-caption className="tactics-caption">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div data-stage className="relative mx-auto w-full max-w-[40rem]">
            <p className="sr-only">{t.tactics.description}</p>
            <svg
              viewBox="0 0 480 420"
              className="block h-auto max-h-[70vh] w-full"
              fill="none"
              aria-hidden="true"
            >
              <g stroke="var(--chalk)" strokeWidth="2">
                <path d="M14 30H466V406H14Z M120 30V126H360V30 M184 30V66H296V30" />
                <path d="M14 44A14 14 0 0 0 28 30 M452 30A14 14 0 0 0 466 44" />
              </g>
              <g stroke="var(--accent)" strokeWidth="2">
                <path d="M194 126A52 52 0 0 0 286 126 M184 406A56 56 0 0 1 296 406" />
              </g>
              <path d="M204 30V12H276V30" stroke="var(--text)" strokeWidth="4" />

              <g
                className="tactics-cover"
                stroke="var(--muted)"
                strokeWidth="2"
                strokeDasharray="5 6"
              >
                <path d={`M${xy(DEFENDERS[0].at)}L${xy(DEFENDERS[1].at)}L${xy(DEFENDERS[2].at)}`} />
              </g>

              {PASSES.map((pass) => (
                <path
                  key={xy(pass.from)}
                  data-trail
                  className="tactics-trail"
                  d={`M${xy(pass.from)}Q${xy(pass.bend)} ${xy(pass.to)}`}
                  pathLength={1}
                  stroke="var(--accent)"
                  strokeWidth="3"
                />
              ))}

              {DEFENDERS.map((player, i) => {
                const role = t.tactics.roles[i];
                const width = role.length * 8 + 22;
                return (
                  <g key={role} data-defender style={{ transform: place(player.at) }}>
                    <g className="tactics-drift" style={drift(player.from, i)}>
                      <circle
                        className="tactics-ring"
                        r="17"
                        stroke="var(--accent)"
                        strokeWidth="3"
                        style={{ '--order': i } as CSSProperties}
                      />
                      <circle r="16" fill="var(--soft)" stroke="var(--text)" strokeWidth="3" />
                      <path d="M-5 -5L5 5M5 -5L-5 5" stroke="var(--text)" strokeWidth="3" />
                      <g className="tactics-badge" style={{ '--order': i } as CSSProperties}>
                        <rect
                          x={-width / 2}
                          y="-45"
                          width={width}
                          height="23"
                          rx="11.5"
                          fill="var(--text)"
                        />
                        <text
                          y="-28.5"
                          textAnchor="middle"
                          fill="var(--soft)"
                          fontSize="14"
                          fontWeight="600"
                        >
                          {role}
                        </text>
                      </g>
                    </g>
                  </g>
                );
              })}

              {ATTACKERS.map((player, i) => (
                <g key={player.label} style={{ transform: place(player.at) }}>
                  <g className="tactics-drift" style={drift(player.from, i + 3)}>
                    <circle r="17" fill="var(--text)" />
                    <text
                      y="5.5"
                      textAnchor="middle"
                      fill="var(--soft)"
                      fontSize="16"
                      fontWeight="600"
                    >
                      {player.label}
                    </text>
                  </g>
                </g>
              ))}

              <g className="tactics-ball">
                <g data-ball style={{ transform: place(ATTACKERS[0].at) }}>
                  {/* At the player's feet, not on the number */}
                  <g transform={`translate(${rtl ? -16 : 16} 14)`}>
                    <circle
                      r="9"
                      fill="var(--brand-orange)"
                      stroke="var(--brand-black)"
                      strokeWidth="2"
                    />
                    <path d="M0 -4L3.8 -1.2L2.4 3.2H-2.4L-3.8 -1.2Z" fill="var(--brand-black)" />
                  </g>
                </g>
              </g>
            </svg>
            <div className="mt-4 flex min-h-11 items-center justify-between">
              <span className="text-sm text-muted">{t.tactics.illustration}</span>
              <span className="tactics-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <button
                type="button"
                hidden
                data-tactics-pause
                aria-pressed="false"
                className="link min-h-11 px-1 text-sm font-semibold"
              >
                {t.tactics.pause}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
