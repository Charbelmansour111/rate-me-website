import { along, ATTACKERS, DEFENDERS, mirror, PASSES, translate } from './tactics-data';

/**
 * Plays the tactics illustration. Without this file the section shows its finished frame; here
 * data-step ("ready", 0, 1, 2) drives the CSS, and step 2 runs a loop of Web Animations.
 */
const SECOND = 1000;
const START = 0.8;
const EVERY = 2.1;
const PASS = 0.9;
const END = START + 2 * EVERY + 1 + 1.6;
const TOTAL = END + 1.2;
const at = (seconds: number) => Math.min(1, seconds / TOTAL);
/** How long steps 1 and 2 last where nothing is pinned. */
const STEP_TIME = [2.4, 3.4];

function playLoop(root: HTMLElement, rtl: boolean): Animation[] {
  const timing = { duration: TOTAL * SECOND, iterations: Infinity };
  const all = <T extends Element>(selector: string) => [...root.querySelectorAll<T>(selector)];
  const animations: Animation[] = [];

  // The ball: samples of each curve, easing out into the receiver.
  const start = mirror(ATTACKERS[0].at, rtl);
  const ball: Keyframe[] = [{ offset: 0, opacity: 1, transform: translate(start) }];
  PASSES.forEach((pass, i) => {
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      ball.push({
        offset: at(START + i * EVERY + t * PASS),
        opacity: 1,
        transform: translate(mirror(along(pass, 1 - (1 - t) ** 2), rtl)),
      });
    }
  });
  const last = ball[ball.length - 1].transform as string;
  ball.push(
    { offset: at(END), opacity: 1, transform: last },
    { offset: at(END + 0.3), opacity: 0, transform: last },
    { offset: at(END + 0.31), opacity: 0, transform: translate(start) },
    { offset: 1, opacity: 1, transform: translate(start) },
  );
  for (const el of all('[data-ball]')) animations.push(el.animate(ball, timing));

  // The trails draw with the ball, then fade.
  all('[data-trail]').forEach((el, i) => {
    const from = START + i * EVERY;
    const frame = (seconds: number, strokeDashoffset: number, opacity: number) => ({
      offset: at(seconds),
      strokeDasharray: '1',
      strokeDashoffset,
      opacity,
    });
    animations.push(
      el.animate(
        [
          frame(0, 1, 0),
          frame(from, 1, 0),
          { ...frame(from + 0.01, 1, 1), easing: 'ease-out' },
          frame(from + PASS, 0, 1),
          frame(from + PASS + 1.6, 0, 0),
          frame(TOTAL, 0, 0),
        ],
        timing,
      ),
    );
  });

  // Defenders react a beat after the ball leaves, slowly enough to read.
  all('[data-defender]').forEach((el, i) => {
    const { at: home, moves } = DEFENDERS[i];
    const frames: Keyframe[] = [];
    const stop = (seconds: number, point: readonly [number, number], opacity = 1) =>
      frames.push({
        offset: at(seconds),
        transform: translate(mirror(point, rtl)),
        opacity,
        easing: 'ease-in-out',
      });
    stop(0, home);
    stop(START, moves[0]);
    for (let move = 1; move < moves.length; move++) {
      const leaves = START + (move - 1) * EVERY + 0.2 + i * 0.1;
      stop(leaves, moves[move - 1]);
      stop(leaves + 1.5, moves[move]);
    }
    // Fade back to the start: gliding there would drag the labels across each other.
    const last = moves[moves.length - 1];
    stop(END, last);
    stop(END + 0.4, last, 0);
    stop(END + 0.41, home, 0);
    stop(TOTAL - 0.2, home);
    stop(TOTAL, home);
    animations.push(el.animate(frames, timing));
  });

  // Attackers with a run make it once they have passed.
  all('[data-attacker]').forEach((el, i) => {
    const { at: home, run } = ATTACKERS[i];
    if (!run) return;
    const leaves = START + run.after * EVERY + 0.6;
    const frame = (seconds: number, point: readonly [number, number], opacity = 1) => ({
      offset: at(seconds),
      transform: translate(mirror(point, rtl)),
      opacity,
      easing: 'ease-in-out',
    });
    animations.push(
      el.animate(
        [
          frame(0, home),
          frame(leaves, home),
          frame(leaves + 1.5, run.to),
          frame(END, run.to),
          frame(END + 0.4, run.to, 0),
          frame(END + 0.41, home, 0),
          frame(TOTAL - 0.2, home),
          frame(TOTAL, home),
        ],
        timing,
      ),
    );
  });
  return animations;
}

/** Ends the loop without a jump: everything glides from where it is to where it belongs. */
function stopLoop(animations: Animation[]) {
  for (const animation of animations) {
    const el = (animation.effect as KeyframeEffect).target;
    const transform = el instanceof SVGGElement ? getComputedStyle(el).transform : null;
    animation.cancel();
    if (el && transform && transform !== 'none') {
      el.animate([{ transform }, {}], { duration: 500, easing: 'ease-in-out' });
    }
  }
}

export function startTactics(root: HTMLElement, signal: AbortSignal) {
  const rtl = document.documentElement.dir === 'rtl';
  const pinned = matchMedia('(min-width: 64rem) and (min-height: 44rem)');
  const button = root.querySelector<HTMLButtonElement>('[data-tactics-pause]')!;
  const stage = root.querySelector('[data-stage]')!;
  let loop: Animation[] = [];
  let timer = 0;
  let visible = false;
  let stopped = false;

  const running = () => visible && !stopped;

  function sync() {
    clearTimeout(timer);
    root.toggleAttribute('data-paused', !running());
    for (const animation of loop) {
      if (running()) animation.play();
      else animation.pause();
    }
    const step = Number(root.dataset.step);
    if (running() && !pinned.matches && step < 2) {
      timer = window.setTimeout(() => go(step + 1), STEP_TIME[step] * SECOND);
    }
  }

  function go(step: number) {
    if (root.dataset.step !== String(step)) {
      stopLoop(loop);
      loop = [];
      root.dataset.step = String(step);
      if (step === 2) loop = playLoop(root, rtl);
    }
    sync();
  }

  // Wait for the first step off-screen; someone already looking at the section keeps the frame.
  const box = root.getBoundingClientRect();
  if (box.top > innerHeight) root.dataset.step = 'ready';

  const seen = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !pinned.matches && !(Number(root.dataset.step) >= 0)) go(0);
      else sync();
    },
    { threshold: 0.35 },
  );
  seen.observe(stage);

  // Pinned: three invisible markers down the track choose the step.
  const markers = [...root.querySelectorAll('[data-marker]')];
  const scroll = new IntersectionObserver(
    (entries) => {
      if (!pinned.matches) return;
      for (const entry of entries) {
        if (entry.isIntersecting) go(markers.indexOf(entry.target));
      }
    },
    { rootMargin: '-50% 0px -49% 0px' },
  );
  for (const marker of markers) scroll.observe(marker);

  button.hidden = false;
  button.addEventListener(
    'click',
    () => {
      stopped = !stopped;
      button.setAttribute('aria-pressed', String(stopped));
      sync();
    },
    { signal },
  );

  signal.addEventListener('abort', () => {
    clearTimeout(timer);
    seen.disconnect();
    scroll.disconnect();
    for (const animation of loop) animation.cancel();
    delete root.dataset.step;
    root.removeAttribute('data-paused');
    button.hidden = true;
  });
}
