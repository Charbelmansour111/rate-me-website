import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { startCardReveals, startParallax, startSpotlights } from './cards';
import { startSmooth } from './smooth';
import type { Walk } from './walk';
import { scrubWalk } from './walk-scroll';

gsap.registerPlugin(ScrollTrigger);

/** What follows the scroll: started as soon as GSAP is in, even in the middle of a scroll. */
export function startScroll(signal: AbortSignal, walk: Walk | undefined) {
  if (walk) scrubWalk(walk, signal);
}

/**
 * The GSAP half of the motion: loaded on the first scroll, touch, key or mouse move. Started once
 * the page is still, since smooth scrolling would stop a scroll under way.
 */
export function startRich(signal: AbortSignal) {
  startSmooth(signal);
  const context = gsap.context(() => {
    startSpotlights(signal);
    startCardReveals(signal);
  });
  const parallax = startParallax();
  // Opening an answer or a form step moves everything below it.
  let frame = 0;
  const resized = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => ScrollTrigger.refresh());
  });
  resized.observe(document.body);

  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frame);
    resized.disconnect();
    parallax.revert();
    context.revert();
  });
}
