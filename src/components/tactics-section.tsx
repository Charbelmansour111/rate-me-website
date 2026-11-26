import Image from 'next/image';
import type { CSSProperties } from 'react';

import { features } from '@/config/features.config';
import { roleLetters, type RoleId } from '@/config/roles.config';
import { getDictionary, type Locale } from '@/i18n';
import {
  arrowHead,
  ATTACKERS,
  DEFENDERS,
  MARKED,
  mirror,
  PASSES,
  ROLE_SHAPES,
  translate,
  type Point,
} from '@/motion/tactics-data';

import { TacticsRoles } from './tactics-roles';

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
    <section id="tactics" data-tactics className="tactics relative" aria-labelledby="tactics-title">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          data-marker
          className="tactics-marker"
          style={{ '--i': i } as CSSProperties}
        />
      ))}
      <div className="tactics-pin">
        <div className="wrap">
          <div className="panel grid items-center gap-x-14 gap-y-10 lg:grid-cols-[1fr_1.25fr]">
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
              <ol className="mt-6 grid gap-4">
                {t.tactics.steps.map((step, i) => (
                  <li key={step.title} data-caption className="tactics-caption">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-muted">{step.text}</p>
                    {i === 1 && (
                      <ul aria-label={t.tactics.rolesLabel} className="mt-2 flex flex-wrap gap-1.5">
                        {(Object.keys(roleLetters) as RoleId[]).map((role) => (
                          <li key={role} className="tactics-role">
                            <b aria-hidden="true">{roleLetters[role]}</b>
                            {t.tactics.roles[role]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
              {/* A real board, from the dugout: the drawing on the right is the app's version */}
              <Image
                src="/features/whiteboard.webp"
                alt={t.features.items.whiteboard.photo}
                width={1200}
                height={750}
                sizes="15rem"
                className="tactics-photo mt-8"
              />
            </div>
            <div data-stage className="relative mx-auto w-full max-w-[46rem]">
              <p className="sr-only">{t.tactics.description}</p>
              <svg
                viewBox="0 0 480 420"
                className="block h-auto max-h-[62vh] w-full"
                fill="none"
                aria-hidden="true"
              >
                {/* Mowing stripes, barely there */}
                <g fill="var(--soft)">
                  {[0, 2, 4, 6].map((i) => (
                    <rect key={i} x="14" y={30 + i * 47} width="452" height="47" />
                  ))}
                </g>
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
                  <path d={`M${xy(DEFENDERS[0].at)}L${xy(DEFENDERS[1].at)}`} />
                </g>

                {/* Shown by a role tried under the board: who marks whom, the lane that is cut */}
                <g className="tactics-role-lines" strokeWidth="2.5" strokeLinecap="round">
                  {ROLE_SHAPES.mark.map((at, i) => (
                    <path
                      key={i}
                      data-show="mark"
                      d={`M${xy(at)}L${xy(MARKED[i])}`}
                      stroke="var(--accent)"
                      strokeDasharray="4 5"
                    />
                  ))}
                  <path
                    data-show="intercept"
                    d={`M${xy(PASSES[0].from)}Q${xy(PASSES[0].bend)} ${xy(PASSES[0].to)}`}
                    stroke="var(--muted)"
                    strokeDasharray="5 6"
                  />
                  <path
                    data-show="intercept"
                    d={`M${xy([108, 352])}L${xy([136, 324])}`}
                    stroke="var(--accent)"
                    strokeWidth="4"
                  />
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
                {PASSES.map((pass) => (
                  <path
                    key={xy(pass.to)}
                    data-arrow
                    className="tactics-arrow"
                    d={arrowHead(pass, rtl)}
                    pathLength={1}
                    stroke="var(--accent)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}

                {DEFENDERS.map((player, i) => (
                  <g key={player.role} data-defender style={{ transform: place(player.at) }}>
                    <g className="tactics-drift" style={drift(player.from, i)}>
                      <Shadow />
                      <circle
                        className="tactics-ring"
                        r="17"
                        stroke="var(--accent)"
                        strokeWidth="3"
                        style={{ '--order': i } as CSSProperties}
                      />
                      <circle r="16" fill="var(--page)" stroke="var(--text)" strokeWidth="3" />
                      <path d="M-5 -5L5 5M5 -5L-5 5" stroke="var(--text)" strokeWidth="3" />
                      <RoleBadge role={player.role} order={i} rtl={rtl} />
                    </g>
                  </g>
                ))}

                {ATTACKERS.map((player, i) => (
                  <g key={player.label} data-attacker style={{ transform: place(player.at) }}>
                    <g className="tactics-drift" style={drift(player.from, i + 3)}>
                      <Shadow />
                      <circle r="17" fill="var(--text)" />
                      <text
                        y="5.5"
                        textAnchor="middle"
                        fill="var(--page)"
                        fontSize="16"
                        fontWeight="600"
                      >
                        {player.label}
                      </text>
                      {player.role && <RoleBadge role={player.role} order={i + 3} rtl={rtl} />}
                    </g>
                  </g>
                ))}

                <g className="tactics-ball">
                  <g data-ball style={{ transform: place(ATTACKERS[0].at) }}>
                    {/* At the player's feet, not on the number */}
                    <g transform={`translate(${rtl ? -16 : 16} 14)`}>
                      <circle
                        className="tactics-pulse"
                        r="9"
                        stroke="var(--accent)"
                        strokeWidth="2"
                      />
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
              <TacticsRoles t={t.tactics.try} rtl={rtl} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A soft shadow under a player, so the board reads as a pitch and not a chart. */
function Shadow() {
  return <ellipse cy="16" rx="15" ry="4.5" fill="var(--brand-black)" opacity="0.12" />;
}

/** The role's first letter at the corner of its player, as on the app's board. */
function RoleBadge({ role, order, rtl }: { role: RoleId; order: number; rtl: boolean }) {
  return (
    <g className="tactics-badge" style={{ '--order': order } as CSSProperties}>
      <g transform={`translate(${rtl ? -17 : 17} -16)`}>
        <circle r="13.5" fill="var(--page)" stroke="var(--text)" strokeWidth="2" />
        <text y="6" textAnchor="middle" fill="var(--text)" fontSize="17" fontWeight="700">
          {roleLetters[role]}
        </text>
      </g>
    </g>
  );
}
