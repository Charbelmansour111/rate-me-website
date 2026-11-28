import { startHero } from './hero';
import { startTactics } from './tactics';
import { startPitchWalk } from './pitch-walk';
import { chooseFormat, softwareRendering, startWalk, type Walk } from './walk';
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
  // A phone plays its own portrait walk (WEBSITE 28), with no intro; the drawing (WEBSITE 27) stands
  // in to save data, on a software renderer, or when the portrait set fails
  const phone = matchMedia('(max-width: 47.99rem)').matches;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const drawn = phone && (Boolean(connection?.saveData) || softwareRendering());
  if (canvas && drawn) startPitchWalk(canvas, signal);
  // On a computer the walk's file format first (AVIF where it decodes, WEBSITE 29): a few
  // milliseconds. A phone's portrait set is WebP alone: it starts at once, as before, and never
  // wakes an AVIF decoder (on a phone's processor that cost Lighthouse about 100 ms of TBT)
  const walkReady: Promise<Walk | undefined> =
    !canvas || drawn
      ? Promise.resolve(undefined)
      : phone
        ? Promise.resolve(startWalk(canvas, signal, () => startPitchWalk(canvas, signal)))
        : chooseFormat().then(() => (signal.aborted ? undefined : startWalk(canvas, signal)));
  // A first visit's intro while the frames come (src/motion/walk-gate.ts); no walk, no intro
  void walkReady.then((walk) => {
    if (signal.aborted) return;
    if (walk) gateWalk(walk, signal);
    else if (document.documentElement.dataset.walkGate === 'open') {
      document.documentElement.dataset.walkGate = 'none';
      (window as Window & { __introRelease?: () => void }).__introRelease?.();
    }
  });
  const hero = document.querySelector<HTMLElement>('[data-hero-drill]');
  if (hero) startHero(hero, signal);
  const tactics = document.querySelector<HTMLElement>('[data-tactics]');
  if (tactics) startTactics(tactics, signal);

  // The heavier half (GSAP, Lenis) waits for the first sign of use, so it never slows the load.
  const used = new AbortController();
  signal.addEventListener('abort', () => used.abort());
  const load = () => {
    used.abort();
    Promise.all([import('./rich'), walkReady]).then(
      ([{ startScroll, startRich }, walk]) => {
        if (signal.aborted) return;
        startScroll(signal, walk);
        whenStill(() => startRich(signal), signal);
      },
      // Offline: the page works without it, with the still pictures behind it.
      () => {
        if (canvas) document.documentElement.dataset.journey = 'off';
      },
    );
  };
  for (const type of FIRST_USE) {
    addEventListener(type, load, { passive: true, signal: used.signal });
  }
}
