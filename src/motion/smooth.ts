import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/**
 * Smooth wheel scrolling. Touch keeps the phone's own scrolling. The window still scrolls for
 * real, so the walk (which reads scrollY) and the sticky whiteboard work as before.
 */
export function startSmooth(signal: AbortSignal) {
  const lenis = new Lenis({ lerp: 0.12 });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (seconds: number) => lenis.raf(seconds * 1000);
  gsap.ticker.add(tick);
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
