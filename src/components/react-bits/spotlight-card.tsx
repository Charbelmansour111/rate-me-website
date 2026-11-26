/**
 * Adapted from React Bits "SpotlightCard" (TS + Tailwind), https://reactbits.dev, by David Haz.
 * License: ./LICENSE.md (MIT + Commons Clause).
 *
 * Changes for this site: rendered on the server with no client JavaScript. Its two layers (the
 * light, and the 1px rim it lights up) are added by src/motion/cards.ts for mouse users only, so
 * nobody else pays for them; GSAP moves them through CSS variables (--spot-x, --spot-y,
 * --spot-on). The light is the accent colour.
 */
import type { CSSProperties, ReactNode } from 'react';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** React Bits' falloff: a soft-edged circle of light, as gradient stops. */
const falloff = (color: string, softness: number) => {
  const soft = clamp(softness, 0, 1);
  const core = (1 - soft) ** 1.5 * 0.85;
  const stop = (alpha: number, at: number) =>
    `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(2)}%, transparent) ${(at * 100).toFixed(2)}%`;
  const list = [stop(1, 0)];
  for (let i = 0; i <= 14; i++) {
    const t = core + ((1 - core) * i) / 14;
    const g = (t - core) / (1 - core);
    const smooth = 1 - g * g * (3 - 2 * g);
    const glow = Math.exp(-4.6 * g * g) * (1 - g ** 6);
    list.push(stop(smooth + (glow - smooth) * soft, t));
  }
  return list.join(', ');
};

/** Set once on a list of cards; the cards inherit it. */
export const spotlightStops = {
  '--spot-fill': falloff('var(--accent)', 0.7),
  '--spot-rim': falloff('var(--accent)', 1),
} as CSSProperties;

type Props = {
  as?: 'li' | 'div';
  className?: string;
  children: ReactNode;
};

export function SpotlightCard({ as: Tag = 'div', className = '', children }: Props) {
  return (
    <Tag data-spotlight data-card-reveal className={`spotlight ${className}`}>
      {children}
    </Tag>
  );
}
