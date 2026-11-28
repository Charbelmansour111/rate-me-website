import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { loading, smoothing } from '@/config/journey.config';

import type { Walk } from './walk';

/** A tenth of the way each frame for the wheel; a touch's fling a little longer. */
const LERP = 0.1;
const TOUCH_LERP = 0.075;

/**
 * Smooth scrolling: the wheel, and touch too where `smoothing.touch` says so (Lenis' syncTouch).
 * The window still scrolls for real, so the walk (which reads scrollY) and the sticky whiteboard
 * work as before.
 *
 * Over the walk (WEBSITE 25) the page goes no faster than the picture can: one frame of the walk's
 * 381 per screen frame (`loading.pace`), in px of the page, at the frame rate the screen really
 * keeps. So the text and the picture move as one, whatever the flick: a drag's steps are clamped to
 * that speed, and for the wheel and a fling, how far Lenis' target may lead the page, so its easing
 * never goes faster. Jumps (a link within the page, End) are not held.
 */
export function startSmooth(signal: AbortSignal, walk?: Walk) {
  const lenis = new Lenis({
    lerp: LERP,
    wheelMultiplier: 0.9,
    smoothWheel: true,
    syncTouch: smoothing.touch,
    syncTouchLerp: TOUCH_LERP,
    // A dialog scrolls itself
    prevent: (node) => node.nodeName === 'DIALOG',
    virtualScroll: (data) => {
      input = data.event.type;
      if (input === 'touchmove' && held()) {
        const now = performance.now();
        const max = limit() * Math.min(50, Math.max(4, now - touched));
        touched = now;
        data.deltaY = Math.max(-max, Math.min(max, data.deltaY));
      } else if (input === 'touchstart') touched = performance.now();
      return true;
    },
  });
  lenis.on('scroll', ScrollTrigger.update);

  /** The last input (wheel, touchmove, touchend), when the finger last moved, a link's glide. */
  let input = 'wheel';
  let touched = 0;
  let linking = false;
  /** How long a screen frame lasts here, in ms, smoothed. */
  let frameMs = 1000 / 60;
  let last = NaN;
  const pace = innerWidth < loading.phoneWidth ? loading.phonePace : loading.pace;
  /** The page's speed limit over the walk, in px per ms: the walk's, a touch under. */
  const limit = () =>
    walk ? (0.97 * pace * walk.frame() * walk.end()) / Math.max(4, frameMs) : Infinity;
  /** Whether the page is held to the walk's speed now: over the walk, and no jump under way. */
  const held = () => Boolean(walk) && !linking && lenis.animatedScroll < walk!.end();

  const tick = (seconds: number) => {
    const now = seconds * 1000;
    if (!Number.isNaN(last)) frameMs = frameMs * 0.9 + Math.min(100, now - last) * 0.1;
    last = now;
    // The wheel and a fling ease toward their target: the lead at which that easing goes as fast
    // as the limit (Lenis moves lerp x 60 of the lead a second)
    if (held() && input !== 'touchmove') {
      const lerp = input === 'touchend' ? TOUCH_LERP : LERP;
      const lead = lenis.targetScroll - lenis.animatedScroll;
      const most = (limit() * 1000) / (lerp * 60);
      if (Math.abs(lead) > most) {
        lenis.scrollTo(lenis.animatedScroll + Math.sign(lead) * most, {
          lerp,
          programmatic: false,
        });
      }
    }
    lenis.raf(now);
  };
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
    linking = true;
    lenis.scrollTo(target, {
      // Quick, so the walk behind it is there in the same time (src/motion/walk-scroll.ts)
      duration: 0.5,
      onComplete: () => {
        linking = false;
        if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) {
          target.tabIndex = -1;
        }
        target.focus({ preventScroll: true });
      },
    });
  }
  addEventListener('click', onClick, { signal });
  // A new input ends a link's glide (Lenis stops it)
  lenis.on('virtual-scroll', () => (linking = false));

  signal.addEventListener('abort', () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  });
  return lenis;
}
