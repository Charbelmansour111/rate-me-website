import { startHero } from './hero';
import { startReveals } from './reveal';
import { startTactics } from './tactics';
import { startWalk } from './walk';

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
  startReveals(signal);
  const walk = document.querySelector<HTMLCanvasElement>('[data-walk]');
  if (walk) startWalk(walk, signal);
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
      ({ startRich }) => whenStill(() => startRich(signal), signal),
      () => {}, // Offline: the page works without it.
    );
  };
  for (const type of FIRST_USE) {
    addEventListener(type, load, { passive: true, signal: used.signal });
  }
}
