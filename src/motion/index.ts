import { startHero } from './hero';
import { startTactics } from './tactics';
import { startWalk } from './walk';
import { gateWalk } from './walk-gate';

/** What says someone is using the page: until then nothing needs GSAP or smooth scrolling. */
const FIRST_USE = ['scroll', 'wheel', 'pointermove', 'pointerdown', 'touchstart', 'keydown'];
/** How long the page must be still before smooth scrolling takes over the scroll. */
const QUIET = 200;

/**
 * Runs `start` once nothing has scrolled for a moment. Taking over in the middle of a scroll would
 * stop it where it is: a jump to #faq, or a phone's fling.
 */
function whenStill(start: () => void, signal: AbortSignal) {
  const still = new AbortController();
  signal.addEventListener('abort', () => still.abort());
  let timer = 0;
  const wait = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      still.abort();
      if (!signal.aborted) start();
    }, QUIET);
  };
  addEventListener('scroll', wait, { passive: true, signal: still.signal });
  wait();
}

export function startMotion(signal: AbortSignal) {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-walk]');
  const walk = canvas ? startWalk(canvas, signal) : undefined;
  // A first visit waits a moment for the frames (src/motion/walk-gate.ts)
  if (walk) gateWalk(walk, signal);
  const hero = document.querySelector<HTMLElement>('[data-hero-drill]');
  if (hero) startHero(hero, signal);
  const tactics = document.querySelector<HTMLElement>('[data-tactics]');
  if (tactics) startTactics(tactics, signal);

  // The heavier half (GSAP, Lenis) waits for the first sign of use, so it never slows the load.
  const used = new AbortController();
  signal.addEventListener('abort', () => used.abort());
  const load = () => {
    used.abort();
    import('./rich').then(
      ({ startScroll, startRich }) => {
        if (signal.aborted) return;
        startScroll(signal, walk);
        whenStill(() => startRich(signal), signal);
      },
      // Offline: the page works without it, with the still pictures behind it.
      () => {
        if (walk) document.documentElement.dataset.journey = 'off';
      },
    );
  };
  for (const type of FIRST_USE) {
    addEventListener(type, load, { passive: true, signal: used.signal });
  }
}
