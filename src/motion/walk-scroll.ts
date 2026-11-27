import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { Walk } from './walk';

/**
 * How quickly the picture closes on the scroll, in seconds: the time to cover about two thirds of
 * the way. Short enough to feel tied to the finger, long enough to glide like film.
 */
const DAMP = 0.12;

/**
 * The speed limit while a hand scrolls: one frame of the walk per screen frame, or, once it has
 * fallen more than BEHIND frames behind, enough to cover the gap in CATCH ms: however fast the
 * scroll, the picture is never far behind it, whatever the screen's frame rate.
 */
const CATCH = 400;
/** Behind by more than this many frames, the speed limit lifts (a hand at its fastest: 0.5 s). */
const BEHIND = 30;

/**
 * A jump, not a scroll: the scroll's target moved this many frames in one update (a link, End, a
 * page opened half way down). A hand, even a fast one through smooth scrolling, moves it a few.
 */
const JUMP = 40;
/**
 * After a jump, or a fast scroll that has stopped, the walk plays through at a steady speed and
 * arrives in this many ms.
 */
const GLIDE = 330;
/** A scroll that has not moved for this long (ms) has stopped. */
const STOPPED = 60;
/**
 * How long (ms) the picture waits for frames still coming before it settles for those further
 * apart: at first it holds on the last one it has rather than jump a gap; over HOLD it takes a
 * frame up to ANCHOR frames of the walk away (the frames kept for a jump, src/config/journey.config),
 * then any.
 */
const HOLD = 400;
const ANCHOR = 8;

/**
 * The walk follows the scroll like a video: ScrollTrigger reads the page's scroll (under smooth
 * scrolling, Lenis' animated one) as the target, and on GSAP's ticker, the loop Lenis runs in, the
 * picture eases toward it, damped, one frame of its set per screen frame at most while a hand
 * scrolls at a normal pace. Between two frames the walk blends them (src/motion/walk.ts).
 *
 * WEBSITE 22: it never jumps across a gap of frames it does not have. Where the next position has
 * no decoded frame near it, the picture holds on the last one until it comes in (milliseconds, from
 * the bytes the worker keeps), then moves on at its steady rate. A fast scroll keeps the picture at
 * most CATCH ms of its travel behind; once the scroll stops, and after a jump, it glides there at a
 * steady speed in GLIDE ms.
 */
export function scrubWalk(
  picture: Walk,
  signal: AbortSignal,
  /** What else follows the walk in the same frame: the panels' colours, the end of the page. */
  followers: ((progress: number) => void)[] = [],
) {
  let target = picture.progress();
  let at = target;
  /** After a jump: how far the walk moves each ms until it has arrived (0: no jump). */
  let glide = 0;
  /** When the target last moved, and how long the picture has held for a frame. */
  let moved = 0;
  let held = 0;
  const aim = (progress: number) => {
    // A jump sets a steady speed from its whole length, so it arrives in GLIDE ms
    if (Math.abs(progress - target) > JUMP * picture.step()) {
      glide = Math.abs(progress - at) / GLIDE;
    }
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
  aim(trigger.progress);

  const tick = (_time: number, deltaTime: number) => {
    const gap = target - at;
    if (gap === 0) return;
    const frame = picture.step();
    // A long pause (a hidden tab) counts as one screen frame
    const dt = Math.min(deltaTime, 100);
    // The scroll has stopped well short of where the picture is: glide there at a steady speed
    if (!glide && Math.abs(gap) > 2 * frame && performance.now() - moved > STOPPED) {
      glide = Math.abs(gap) / GLIDE;
    }
    let next: number;
    if (glide) {
      // Straight there at its speed, the frames blending as they pass
      next = Math.abs(gap) <= glide * dt ? target : at + Math.sign(gap) * glide * dt;
    } else {
      // A hand: damped, within the speed limit
      let move = gap * (1 - Math.exp(-dt / 1000 / DAMP));
      const limit =
        Math.abs(gap) > BEHIND * frame ? Math.max(frame, (Math.abs(gap) * dt) / CATCH) : frame;
      if (Math.abs(move) > limit) move = Math.sign(move) * limit;
      // Close enough to show the frame it is on: stop there
      next = Math.abs(gap - move) < frame * 0.02 ? target : at + move;
    }
    // No frame near where it would go (still coming): hold on the one it has, for a while
    const reach = Math.max(frame, Math.abs(next - at)) + (held / HOLD) * ANCHOR * frame;
    const near = picture.covers(next, reach);
    if (!near && held < HOLD) {
      held += dt;
      return;
    }
    // Waited long enough: it moves on with what there is, until frames are near again
    if (near) held = 0;
    at = next;
    if (at === target) glide = 0;
    seek(at, at === target);
  };
  gsap.ticker.add(tick);
  seek(at, true);

  signal.addEventListener('abort', () => {
    gsap.ticker.remove(tick);
    trigger.kill();
  });
}
