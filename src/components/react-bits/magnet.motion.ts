/**
 * Adapted from React Bits "Magnet" (TS + Tailwind), https://reactbits.dev, by David Haz.
 * License: ./LICENSE.md (MIT + Commons Clause).
 *
 * Changes for this site: no wrapper element (the tabs stay direct children of their tablist), and
 * GSAP's quickTo with a calm ease-out stands in for React Bits' spring (no bounce: DESIGN.md). As there: within `PADDING`
 * pixels of an element the mouse draws it in, by its distance over `STRENGTH`, at most `MAX` pixels.
 */
import { gsap } from 'gsap';

const PADDING = 28;
const STRENGTH = 4;
const MAX = 6;

export function startMagnets(signal: AbortSignal) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const magnets = [...document.querySelectorAll<HTMLElement>('[data-magnet]')].map((el) => {
    const spring = { duration: 0.6, ease: 'power3.out' };
    return { el, x: gsap.quickTo(el, 'x', spring), y: gsap.quickTo(el, 'y', spring), on: false };
  });
  if (!magnets.length) return;
  const pull = (offset: number) => Math.max(-MAX, Math.min(MAX, offset / STRENGTH));
  const root = document.documentElement;
  /** The lists they sit in: away from all of them, no tab is measured. */
  const groups = [...new Set(magnets.map(({ el }) => el.parentElement!))];
  const near = (event: PointerEvent) =>
    groups.some((group) => {
      const box = group.getBoundingClientRect();
      return (
        event.clientX > box.left - PADDING &&
        event.clientX < box.right + PADDING &&
        event.clientY > box.top - PADDING &&
        event.clientY < box.bottom + PADDING
      );
    });

  addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      // The browser sends moves as the page glides under a still mouse: nothing to pull.
      if (root.classList.contains('lenis-smooth')) return;
      if (!near(event) && !magnets.some(({ on }) => on)) return;
      for (const magnet of magnets) {
        const box = magnet.el.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const close =
          Math.abs(dx) < box.width / 2 + PADDING && Math.abs(dy) < box.height / 2 + PADDING;
        if (close) {
          magnet.on = true;
          magnet.x(pull(dx));
          magnet.y(pull(dy));
        } else if (magnet.on) {
          magnet.on = false;
          magnet.x(0);
          magnet.y(0);
        }
      }
    },
    { passive: true, signal },
  );
  signal.addEventListener('abort', () => {
    for (const { el } of magnets) {
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: 'transform' });
    }
  });
}
