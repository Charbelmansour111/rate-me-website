import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { loading } from '@/config/journey.config';

import type { Walk } from './walk';

/**
 * How quickly the picture closes on the scroll, in seconds: the time to cover about two thirds of
 * the way. Short enough to feel tied to the finger, long enough to glide like film.
 */
const DAMP = 0.12;

/**
 * A jump, not a scroll: the scroll's target moved this many frames (of the 381) in one update (End,
 * a page opened half way down). A hand, even a fast flick through smooth scrolling, moves it a few.
 */
const JUMP = 40;
/** A jump (and a link within the page) glides to its frame in this many ms. */
const GLIDE = 500;
/**
 * During a link's glide, until the page has stopped (no scroll for SETTLED ms), the walk is where the
 * page is, without the speed limit: the page's own glide is eased.
 */
const SETTLED = 200;

/**
 * The walk plays like a video (WEBSITE 24): ScrollTrigger reads the page's scroll (under smooth
 * scrolling, Lenis' animated one) as the target, and on GSAP's ticker, the loop Lenis runs in, the
 * picture moves toward it through the frames in order, damped, never more than `loading.pace`
 * frames of the 381 per screen frame (one frame: two steps once the in-between frames are in; half a
 * step on a phone's thinned set, blending the two), and only onto frames that are decoded: when the next is not,
 * it waits on the one it has. So a flick never skips, cuts or shows a frame twice blended; the
 * scroll itself stays free, and the picture catches up the same way once it stops.
 *
 * A jump is the one exception: End, a page opened half way down, or a link within the page (a menu
 * item) goes there in about GLIDE ms through the frames it has on the way: a jump in one glide, a
 * link by keeping close to the page, which glides there in the same time.
 */
export function scrubWalk(
  picture: Walk,
  signal: AbortSignal,
  /** What else follows the walk in the same frame: the panels' colours, the end of the page. */
  followers: ((progress: number) => void)[] = [],
) {
  let target = picture.progress();
  let at = target;
  /** A jump under way: where it goes and how far it moves each ms (0: none). */
  let jumpTo = 0;
  let glide = 0;
  /** A link's jump under way, until the page stops; when the scroll last moved. */
  let linked = false;
  let moved = 0;
  const steps = innerWidth < loading.phoneWidth ? loading.phonePace : loading.pace;

  const jump = (to: number) => {
    jumpTo = Math.min(1, Math.max(0, to));
    glide = Math.abs(jumpTo - at) / GLIDE;
  };
  const aim = (progress: number) => {
    // (A link's glide moves the page fast at first: the walk follows it instead, below)
    if (!linked && Math.abs(progress - target) > JUMP * picture.frame()) jump(progress);
    if (progress !== target) moved = performance.now();
    target = progress;
  };
  const seek = (progress: number, resting: boolean) => {
    picture.seek(progress, resting);
    for (const follow of followers) follow(progress);
  };

  const trigger = ScrollTrigger.create({
    start: 0,
    end: () => picture.end(),
    onUpdate: (self) => aim(self.progress),
    onRefresh: (self) => aim(self.progress),
  });
  // Opened half way down, or scrolled far before this code loaded: a jump there
  aim(trigger.progress);

  /**
   * A link within the page (the menu, the hero's button): the page glides there (smooth scrolling
   * or the browser's own), and the walk keeps up with it rather than play every frame on the way.
   */
  function onClick(event: MouseEvent) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const link = (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href*="#"]');
    if (!link || link.target) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    if (!document.getElementById(decodeURIComponent(url.hash.slice(1)))) return;
    linked = true;
    glide = 0;
    moved = performance.now();
  }
  addEventListener('click', onClick, { capture: true, signal });

  const tick = (_time: number, deltaTime: number) => {
    // A long pause (a hidden tab) counts as one screen frame
    const dt = Math.min(deltaTime, 100);
    if (glide) {
      // A jump: straight there at its speed, through the frames it has
      const gap = jumpTo - at;
      at = Math.abs(gap) <= glide * dt ? jumpTo : at + Math.sign(gap) * glide * dt;
      if (at === jumpTo) glide = 0;
      seek(at, at === target);
      return;
    }
    const gap = target - at;
    if (linked) {
      // A link's glide: the page itself glides there in GLIDE ms (src/motion/smooth.ts); the picture
      // is where the page is, through the frames it has, until it stops
      if (gap === 0) {
        if (performance.now() - moved > SETTLED) linked = false;
        return;
      }
      at = target;
      seek(at, true);
      return;
    }
    if (gap === 0) return;
    const step = picture.step();
    // Damped toward the scroll, within the speed limit
    let move = gap * (1 - Math.exp(-dt / 1000 / DAMP));
    const limit = steps * picture.frame();
    if (Math.abs(move) > limit) move = Math.sign(move) * limit;
    // Close enough to show the frame it is on: stop there
    const wanted = Math.abs(gap - move) < step * 0.02 ? target : at + move;
    // Only as far as the frames are decoded: else it waits on the one it has
    const next = picture.reach(at, wanted);
    if (next === at) return;
    at = next;
    seek(at, at === target);
  };
  gsap.ticker.add(tick);
  seek(at, true);

  signal.addEventListener('abort', () => {
    gsap.ticker.remove(tick);
    trigger.kill();
  });
}
