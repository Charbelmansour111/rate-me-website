import { buildPlay, passPath, toKeyframes, trailKeyframes } from './play-engine';
import { PLAYER_IDS, PLAYS } from './plays';

const REST = 700;

/** Runs the plays one after the other, for as long as the board is on screen. */
export function startHero(root: HTMLElement, signal: AbortSignal) {
  const rtl = document.documentElement.dir === 'rtl';
  const $ = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
  const ball = $('[data-play-ball]');
  const name = $('[data-play-name]');
  const names = JSON.parse(root.dataset.plays!) as string[];
  const trails = [...root.querySelectorAll<SVGPathElement>('[data-play-trail]')];
  const button = $<HTMLButtonElement>('[data-play-pause]');
  let index = -1;
  let running: Animation[] = [];
  let timer = 0;
  let visible = false;
  let stopped = false;

  function next() {
    index = (index + 1) % PLAYS.length;
    const play = buildPlay(PLAYS[index]);
    const timing = { duration: play.duration * 1000, fill: 'both' as const };
    const old = running;
    running = PLAYER_IDS.map((id) =>
      $(`[data-player="${id}"]`).animate(toKeyframes(play.players[id], rtl), timing),
    );
    running.push(ball.animate(toKeyframes(play.ball, rtl, 'linear'), timing));
    trails.forEach((trail, i) => {
      const pass = play.passes[i];
      trail.setAttribute('d', pass ? passPath(pass, rtl) : '');
      if (pass) running.push(trail.animate(trailKeyframes(pass, play.duration), timing));
    });
    for (const animation of old) animation.cancel();
    name.textContent = names[index];
    root.dataset.play = PLAYS[index].id;
    running[0].onfinish = () => {
      timer = window.setTimeout(next, REST);
    };
    sync();
  }

  function sync() {
    const go = visible && !stopped;
    clearTimeout(timer);
    for (const animation of running) {
      if (animation.playState === 'finished') continue;
      if (go) animation.play();
      else animation.pause();
    }
    if (go && (index < 0 || running[0]?.playState === 'finished')) {
      timer = window.setTimeout(next, index < 0 ? 0 : REST);
    }
  }

  const seen = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  seen.observe(root);

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
    seen.disconnect();
    clearTimeout(timer);
    for (const animation of running) animation.cancel();
    button.hidden = true;
    // Back to the first play's finished drawing
    const first = buildPlay(PLAYS[0]);
    trails.forEach((trail, i) =>
      trail.setAttribute('d', first.passes[i] ? passPath(first.passes[i], rtl) : ''),
    );
    name.textContent = names[0];
    delete root.dataset.play;
  });
}
