import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { Walk } from './walk';

/** How long the walk takes to reach the page when GSAP arrives after the page has moved. */
const CATCH_UP = 0.4;

/**
 * The walk follows the scroll, one frame of the walk per few pixels and the same number all the
 * way: ScrollTrigger reads the page's scroll (under smooth scrolling, Lenis' animated one) on GSAP's
 * ticker, the loop Lenis runs in, so the picture and the page move in the same frame. No easing of
 * its own: Lenis already smooths the wheel, and a finger is followed exactly.
 */
export function scrubWalk(walk: Walk, signal: AbortSignal) {
  let catchUp: gsap.core.Tween | undefined;
  const trigger = ScrollTrigger.create({
    start: 0,
    end: () => walk.end(),
    onUpdate: (self) => {
      if (!catchUp) walk.seek(self.progress);
    },
    onRefresh: (self) => {
      if (!catchUp) walk.seek(self.progress);
    },
  });
  // The page was scrolled before this loaded: glide there, still following the scroll, no jump.
  const from = walk.progress();
  if (Math.abs(trigger.progress - from) > 0.0005) {
    const mix = { k: 0 };
    catchUp = gsap.to(mix, {
      k: 1,
      duration: CATCH_UP,
      ease: 'power2.out',
      onUpdate: () => walk.seek(from + (trigger.progress - from) * mix.k),
      onComplete: () => {
        catchUp = undefined;
        walk.seek(trigger.progress);
      },
    });
  }
  signal.addEventListener('abort', () => {
    catchUp?.kill();
    trigger.kill();
  });
}
