/**
 * Adapted from React Bits "TiltedCard" (TS + Tailwind), https://reactbits.dev, by David Haz.
 * License: ./LICENSE.md (MIT + Commons Clause).
 *
 * Changes for this site: plain markup, with no state, effects or loop of its own.
 * The card leans towards the mouse and a glare follows it, as in React Bits, but GSAP drives both
 * (./tilted-card.motion.ts) from the motion code that loads on first use, for mouse users only.
 * No flip, tooltip, gyroscope or intro; no blurred shadow (the glow behind it is CSS).
 */
import type { ReactNode } from 'react';

export function TiltedCard({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-tilt className={`tilted-card ${className}`}>
      {children}
      <span className="tilted-card-glare" aria-hidden="true" />
    </div>
  );
}
