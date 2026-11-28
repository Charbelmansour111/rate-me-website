import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { startCardReveals } from './cards';
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
  // A phone (narrow, or a finger): the panels change colour once a stage, no blend (WEBSITE 26)
  const phone = matchMedia('(max-width: 47.99rem), (pointer: coarse)').matches;
  // Nor where the walk has gone light (the quality governor)
  if (walk) scrubWalk(walk, signal, [followStages(signal, () => phone || walk.quality() >= 2)]);
  // A phone (WEBSITE 27): what costs smoothness goes. Its page line follows the drawing's own loop
  // (src/motion/pitch-walk.ts): no ScrollTrigger runs there. The words and cards rising in as they
  // come, and the brush strokes drawing, are effects over content that is there at rest
  if (narrow()) return;
  startChrome(signal);
  startBrush(signal);
  startReveals(signal);
}

/** A phone's width: its walk is a drawing, and the effects that cost smoothness stay off. */
const narrow = () => matchMedia('(max-width: 47.99rem)').matches;

/**
 * The GSAP half of the motion: loaded on the first scroll, touch, key or mouse move. Started once
 * the page is still, since smooth scrolling would stop a scroll under way.
 */
export function startRich(signal: AbortSignal) {
  // Smooth scrolling is for a mouse wheel: a phone scrolls as it does, and runs no loop for it
  if (!narrow()) startSmooth(signal);
  const context = gsap.context(() => {
    if (!narrow()) startCardReveals(signal);
    startTabGlide(signal);
  });
  // The mouse's effects, in their own chunk, only where there is a mouse
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    void import('./hover').then(({ startHover }) => {
      if (!signal.aborted) startHover(signal);
    });
  }
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
    context.revert();
  });
}
