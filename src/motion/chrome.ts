import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { followPage } from './page-line';

/**
 * Everything that follows the page as a whole: the header's progress line, the running line down
 * the edge, and the end of the page (the walk dims, the pitch lines draw in, the footer rises).
 * One ScrollTrigger for the page, on GSAP's ticker with the walk. Never runs under reduced
 * motion: the CSS then shows the end state.
 */
export function startChrome(signal: AbortSignal) {
  const root = document.documentElement;
  root.dataset.motion = 'on';
  const follow = followPage();
  const page = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => follow(self.progress, self.scroll()),
    onRefresh: (self) => follow(self.progress, self.scroll(), true),
  });

  const footer = startFooter();
  signal.addEventListener('abort', () => {
    page.kill();
    footer?.kill();
    delete root.dataset.motion;
    follow.stop();
  });
}

/** The pitch lines draw themselves in and the footer's parts rise, once, as it comes in. */
function startFooter() {
  const footer = document.querySelector<HTMLElement>('[data-footer]');
  if (!footer) return;
  const lines = [...footer.querySelectorAll<SVGPathElement>('[data-draw]')];
  const parts = footer.querySelectorAll<HTMLElement>('[data-rise]');
  // Already on the screen (a short page, or a jump to the end): leave it as it is
  if (footer.getBoundingClientRect().top < innerHeight) return;
  for (const path of lines) {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
  }
  gsap.set(parts, { y: 28, opacity: 0 });
  const play = gsap
    .timeline({ paused: true, defaults: { ease: 'power3.out' } })
    .to(lines, { strokeDashoffset: 0, duration: 1.1, stagger: 0.08 }, 0)
    .to(parts, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, clearProps: 'all' }, 0.15);
  const trigger = ScrollTrigger.create({
    trigger: footer,
    start: 'top 92%',
    once: true,
    onEnter: () => play.play(),
  });
  return {
    kill() {
      trigger.kill();
      play.progress(1).kill();
      gsap.set([...lines, ...parts], { clearProps: 'all' });
    },
  };
}
