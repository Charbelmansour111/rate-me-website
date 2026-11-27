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
  /** Set by a jump, until the walk has arrived. */
  let jumping = false;
  const aim = (progress: number) => {
    if (Math.abs(progress - target) > JUMP * picture.step()) jumping = true;
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
    const share = 1 - Math.exp(-Math.min(deltaTime, 100) / 1000 / DAMP);
    const frame = picture.step();
    // A hand: one frame of the walk per screen frame at most. A jump: glide there quickly.
    const most = jumping ? Math.max(frame, Math.abs(gap) / GLIDE) : frame;
    let move = gap * share;
    if (Math.abs(move) > most) move = Math.sign(move) * most;
    // Close enough to show the frame it is on: stop there
    at = Math.abs(gap - move) < frame * 0.02 ? target : at + move;
    if (at === target) jumping = false;
    seek(at);
  };
  gsap.ticker.add(tick);
  seek(at);

  signal.addEventListener('abort', () => {
    gsap.ticker.remove(tick);
    trigger.kill();
  });
}
