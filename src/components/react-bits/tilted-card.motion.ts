/**
 * The motion half of React Bits "TiltedCard" (./tilted-card.tsx), by David Haz, https://reactbits.dev.
 * License: ./LICENSE.md (MIT + Commons Clause).
 *
 * As in React Bits: the card turns towards the mouse by up to `AMPLITUDE` degrees, rises a little,
 * and a glare sits where the light would catch it. GSAP's quickTo stands in for React Bits' springs.
 */
import { gsap } from 'gsap';

const AMPLITUDE = 7;
const SCALE = 1.03;
/** How bright the glare gets, 0 to 1. */
const GLARE = 0.5;

export function startTilts(signal: AbortSignal) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const root = document.documentElement;
  for (const card of document.querySelectorAll<HTMLElement>('[data-tilt]')) {
    gsap.set(card, { transformPerspective: 900 });
    const follow = { duration: 0.6, ease: 'power3.out' };
    const turnX = gsap.quickTo(card, 'rotationX', follow);
    const turnY = gsap.quickTo(card, 'rotationY', follow);
    const lift = gsap.quickTo(card, 'scale', follow);
    const glareX = gsap.quickTo(card, '--tc-gx', follow);
    const glareY = gsap.quickTo(card, '--tc-gy', follow);
    const glare = gsap.quickTo(card, '--tc-glare', { duration: 0.4, ease: 'power2.out' });

    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      // The browser sends moves as the page glides under a still mouse: the card waits.
      if (root.classList.contains('lenis-smooth')) return;
      const box = card.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
      const y = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
      turnX(-y * AMPLITUDE);
      turnY(x * AMPLITUDE);
      lift(SCALE);
      glareX(50 + x * 46);
      glareY(50 + y * 46);
      glare(GLARE);
    };
    const leave = () => {
      turnX(0);
      turnY(0);
      lift(1);
      glare(0);
    };
    card.addEventListener('pointermove', move, { signal });
    card.addEventListener('pointerleave', leave, { signal });
    signal.addEventListener('abort', () => {
      gsap.killTweensOf(card);
      gsap.set(card, { clearProps: 'all' });
    });
  }
}
