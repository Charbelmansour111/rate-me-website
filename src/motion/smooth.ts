import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/**
 * Smooth wheel scrolling. Touch keeps the phone's own scrolling. The window still scrolls for
 * real, so the walk (which reads scrollY) and the sticky whiteboard work as before. The page is
 * never held back (WEBSITE 26): the picture keeps up with it instead (src/motion/walk-scroll.ts).
 * Lenis' own work is a fraction of a millisecond a frame.
 */
export function startSmooth(signal: AbortSignal) {
  // A tenth of the way each frame, and wheel notches a little shorter: a glide, not a lurch.
  const lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 0.9,
    smoothWheel: true,
    // A dialog scrolls itself
    prevent: (node) => node.nodeName === 'DIALOG',
  });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (seconds: number) => lenis.raf(seconds * 1000);
  // First in the loop: the page moves, then everything that follows it reads where it is
  gsap.ticker.add(tick, false, true);
  gsap.ticker.lagSmoothing(0);

  /** Links within the page glide there, then do what a jump does: the address and the focus. */
  function onClick(event: MouseEvent) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href*="#"]');
    if (!link || link.target) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    history.pushState(null, '', url.hash);
    lenis.scrollTo(target, {
      // Quick, so the walk behind it is there in the same time (src/motion/walk-scroll.ts)
      duration: 0.5,
      onComplete: () => {
        if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) {
          target.tabIndex = -1;
        }
        target.focus({ preventScroll: true });
      },
    });
  }
  addEventListener('click', onClick, { signal });

  signal.addEventListener('abort', () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  });
  return lenis;
}
