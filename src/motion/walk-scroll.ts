import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { Walk } from './walk';

/**
 * How quickly the picture closes on the scroll, in seconds: the time to cover about two thirds of
 * the way. Short enough to feel tied to the finger, long enough to glide like film.
 */
const DAMP = 0.12;

/**
 * A jump, not a scroll: the scroll's target moved this many frames in one update (a link, End, a
 * page opened half way down). A hand, even a fast one through smooth scrolling, moves it a few.
 */
const JUMP = 40;
/** After a jump the walk plays through in about this many screen frames (about a third of a second). */
const GLIDE = 20;

/**
 * The walk follows the scroll like a video: ScrollTrigger reads the page's scroll (under smooth
 * scrolling, Lenis' animated one) as the target, and on GSAP's ticker, the loop Lenis runs in, the
 * picture eases toward it, damped, never more than one frame of its set per screen frame while a
 * hand scrolls. Between two frames the walk blends them by the fraction (src/motion/walk.ts), so it
 * never steps. A jump (a link, End, a page opened half way down) glides there in about a third of
 * a second instead of cutting.
 */
export function scrubWalk(
  picture: Walk,
  signal: AbortSignal,
  /** What else follows the walk in the same frame: the panels' colours, the end of the page. */
  followers: ((progress: number) => void)[] = [],
) {
  let target = picture.progress();
  let at = target;
  /** After a jump: how far the walk moves each screen frame until it has arrived (0: no jump). */
  let glide = 0;
  const aim = (progress: number) => {
    // A jump sets a steady speed from its whole length, so it arrives in GLIDE screen frames
    if (Math.abs(progress - target) > JUMP * picture.step()) {
      glide = Math.abs(progress - at) / GLIDE;
    }
    target = progress;
  };
  const seek = (progress: number) => {
    picture.seek(progress);
    for (const follow of followers) follow(progress);
  };

  const trigger = ScrollTrigger.create({
    start: 0,
    end: () => picture.end(),
    onUpdate: (self) => aim(self.progress),
    onRefresh: (self) => aim(self.progress),
  });
  aim(trigger.progress);

  // Each screen frame: a damped step toward the scroll, at most one frame of the walk
  const tick = (_time: number, deltaTime: number) => {
    const gap = target - at;
    if (gap === 0) return;
    const frame = picture.step();
    if (glide) {
      // A jump: straight there at its speed, the frames blending as they pass
      at = Math.abs(gap) <= glide ? target : at + Math.sign(gap) * glide;
      if (at === target) glide = 0;
    } else {
      // A hand: damped, one frame of the walk per screen frame at most
      let move = gap * (1 - Math.exp(-Math.min(deltaTime, 100) / 1000 / DAMP));
      if (Math.abs(move) > frame) move = Math.sign(move) * frame;
      // Close enough to show the frame it is on: stop there
      at = Math.abs(gap - move) < frame * 0.02 ? target : at + move;
    }
    seek(at);
  };
  gsap.ticker.add(tick);
  seek(at);

  signal.addEventListener('abort', () => {
    gsap.ticker.remove(tick);
    trigger.kill();
  });
}
