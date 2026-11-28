import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { Walk } from './walk';

/**
 * How far the picture may trail the page in ordinary scrolling, in frames of the 381: past this
 * it shows the thumbnail track (a fast scroll, a jump) until the exact frames are in.
 */
const GAP = 2;
/** The quality governor (WEBSITE 26): over the last FRAMES screen frames, on average. */
const FRAMES = 30;
/** Slower than this (ms a frame), a step down; faster than GOOD for HOLD ms, a step back up. */
const SLOW = 20;
const GOOD = 17.5;
const HOLD = 2000;

/**
 * The walk plays like a video, and the page and the picture are one motion (WEBSITE 26): the page
 * scrolls freely (natively, or through Lenis' glide on a mouse wheel), ScrollTrigger reads where it
 * is once a frame, and on GSAP's ticker (the one loop every scrolled visual runs in) the picture
 * is put there:
 * - its exact frames decoded: the walk shows that point, blending the two frames round it;
 * - else, within GAP frames, the nearest decoded frame on the way (it trails a little);
 * - else (a fast scroll, a jump, a link) the nearest frame of the thumbnail track or of those
 *   decoded, at once, and the exact frame as soon as it is decoded, well within a second.
 * At rest, once the page has stopped, the nearest frame shows alone.
 *
 * The quality governor watches the time of the last screen frames: slower than SLOW ms on average,
 * the walk does less (no tier 2, then no blending, then half resolution: src/motion/walk.ts,
 * quality); after HOLD ms of good frames, a step back. Not where the page forces it (`walk-quality`
 * in localStorage, as the tests do).
 */
export function scrubWalk(
  picture: Walk,
  signal: AbortSignal,
  /** What else follows the walk in the same frame: the panels' colours. */
  followers: ((progress: number) => void)[] = [],
) {
  let target = picture.progress();
  let at = target;
  /** The target on the last screen frame, whether the frame alone shows, a thumbnail shows. */
  let before = target;
  let rested = true;
  let glanced = false;

  const trigger = ScrollTrigger.create({
    start: 0,
    end: () => picture.end(),
    onUpdate: (self) => (target = self.progress),
    onRefresh: (self) => (target = self.progress),
  });
  target = trigger.progress;

  const follow = (progress: number) => {
    for (const one of followers) one(progress);
  };
  const seek = (progress: number, resting: boolean) => {
    picture.seek(progress, resting);
    follow(progress);
  };

  // The governor
  let forced = false;
  try {
    forced = localStorage.getItem('walk-quality') !== null;
  } catch {
    // Storage off: the governor decides
  }
  const times = new Float32Array(FRAMES);
  let filled = 0;
  let sum = 0;
  let good = 0;
  const govern = (dt: number) => {
    if (forced || document.hidden) return;
    sum += dt - times[filled % FRAMES];
    times[filled % FRAMES] = dt;
    filled++;
    if (filled < FRAMES) return;
    const average = sum / FRAMES;
    const level = picture.quality();
    if (average > SLOW && level < 3) {
      picture.quality(level + 1);
      filled = 0;
      sum = 0;
      times.fill(0);
      good = 0;
    } else if (average < GOOD && level > 0) {
      good += dt;
      if (good >= HOLD) {
        picture.quality(level - 1);
        good = 0;
      }
    } else good = 0;
  };

  const tick = (_time: number, deltaTime: number) => {
    // A long pause (a hidden tab) is no slow frame
    if (deltaTime < 250) govern(deltaTime);
    const still = target === before;
    before = target;
    if (at === target) {
      // A thumbnail on show: the exact frame as soon as it is in
      if (glanced && picture.has(at)) {
        glanced = false;
        seek(at, still);
      } else if (still && !rested && !glanced) {
        rested = true;
        seek(at, true);
      }
      return;
    }
    rested = false;
    const frame = picture.frame();
    // Its exact frames, else the nearest decoded on the way, within GAP frames
    const next = picture.reach(at, target);
    if (next === target || Math.abs(target - next) <= GAP * frame) {
      glanced = false;
      at = next;
      seek(at, false);
      return;
    }
    // Too far behind: where the page is, from the thumbnail track, until the frames are in
    at = target;
    glanced = true;
    picture.glance(at);
    follow(at);
  };
  gsap.ticker.add(tick);
  seek(at, true);

  signal.addEventListener('abort', () => {
    gsap.ticker.remove(tick);
    trigger.kill();
  });
}
