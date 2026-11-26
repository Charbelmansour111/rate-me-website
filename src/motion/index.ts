import { startHero } from './hero';
import { startDetails, startReveals } from './reveal';
import { startTactics } from './tactics';
import { startWalk } from './walk';

/** What says someone is using the page: until then nothing needs GSAP or smooth scrolling. */
const FIRST_USE = ['scroll', 'wheel', 'pointermove', 'pointerdown', 'touchstart', 'keydown'];

export function startMotion(signal: AbortSignal) {
  startReveals(signal);
  startDetails(signal);
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
      ({ startRich }) => {
        if (!signal.aborted) startRich(signal);
      },
      () => {}, // Offline: the page works without it.
    );
  };
  for (const type of FIRST_USE) {
    addEventListener(type, load, { passive: true, signal: used.signal });
  }
}
