import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { startMagnets } from '@/components/react-bits/magnet.motion';
import { startTilts } from '@/components/react-bits/tilted-card.motion';

import { startCardReveals, startParallax, startSpotlights } from './cards';
import { startBrush } from './brush';
import { startChrome } from './chrome';
import { startReveals } from './reveal';
import { startSmooth } from './smooth';
import { startTabGlide } from './tabs';
import type { Walk } from './walk';
import { followStages } from './stages';
import { scrubWalk } from './walk-scroll';

gsap.registerPlugin(ScrollTrigger);

/** What follows the scroll: started as soon as GSAP is in, even in the middle of a scroll. */
export function startScroll(signal: AbortSignal, walk: Walk | undefined) {
  if (walk) scrubWalk(walk, signal, [followStages(signal)]);
  startChrome(signal);
  startBrush(signal);
  startReveals(signal);
}

/**
 * The GSAP half of the motion: loaded on the first scroll, touch, key or mouse move. Started once
 * the page is still, since smooth scrolling would stop a scroll under way.
 */
export function startRich(signal: AbortSignal, walk: Walk | undefined) {
  startSmooth(signal, walk);
  const context = gsap.context(() => {
    startSpotlights(signal);
    startCardReveals(signal);
    startTilts(signal);
    startMagnets(signal);
    startTabGlide(signal);
  });
  const parallax = startParallax();
  // Opening an answer or a form step moves everything below it. Not on the first call, which only
  // reports the size it starts with: a refresh then would nudge the scroll as Lenis takes over.
  let frame = 0;
  let height = document.body.offsetHeight;
  const resized = new ResizeObserver(() => {
    if (document.body.offsetHeight === height) return;
    height = document.body.offsetHeight;
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
