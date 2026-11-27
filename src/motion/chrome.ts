import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** The last part of the walk over which it dims and the footer arrives. */
export const END = 0.12;
/** How dark the walk gets at the very end: brightness 1 to 0.45, as a black layer over it. */
const DIM = 0.55;
/** Where the tip of the running line is, down the screen. */
const TIP = 0.55;

/**
 * Everything that follows the page as a whole: the header's progress line, the running line down
 * the edge, and the end of the page (the walk dims, the pitch lines draw in, the footer rises).
 * One ScrollTrigger for the page, on GSAP's ticker with the walk. Never runs under reduced
 * motion: the CSS then shows the end state.
 */
export function startChrome(signal: AbortSignal) {
  const root = document.documentElement;
  root.dataset.motion = 'on';
  // The progress line itself, not a custom property on the header: a property set on the bar
  // restyles all of the header on every scrolled frame (WEBSITE 19); a transform on the line is
  // drawn by the compositor alone
  const bar = document.querySelector<HTMLElement>('.site-bar-progress');
  const dim = document.querySelector<HTMLElement>('[data-walk-dim]');
  const line = startRunningLine();

  const page = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const p = self.progress;
      if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
      if (dim) dim.style.opacity = String(DIM * Math.max(0, (p - (1 - END)) / END));
      line?.(self.scroll());
    },
    onRefresh: (self) => line?.(self.scroll(), true),
  });

  const footer = startFooter();
  signal.addEventListener('abort', () => {
    page.kill();
    footer?.kill();
    delete root.dataset.motion;
    bar?.style.removeProperty('transform');
    if (dim) dim.style.removeProperty('opacity');
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

/**
 * The running line (src/components/running-line.tsx): drawn down to a point just past the middle
 * of the screen, a node filled as the tip passes it, the ball on the tip.
 */
function startRunningLine() {
  const host = document.querySelector<HTMLElement>('[data-run-line]');
  if (!host) return;
  host.dataset.live = '';
  let svg: SVGSVGElement | null = null;
  let top = 0;
  let bottom = 1;
  let nodes: { el: SVGCircleElement; y: number; on: boolean }[] = [];
  let fill: SVGPathElement | null = null;
  let ball: SVGGElement | null = null;
  let origin = 0;
  const read = () => {
    svg = host.querySelector('svg');
    if (!svg) return false;
    top = Number(svg.dataset.top);
    bottom = Number(svg.dataset.bottom);
    fill = svg.querySelector('.run-fill');
    ball = svg.querySelector('.run-ball');
    nodes = [...svg.querySelectorAll<SVGCircleElement>('.run-node')].map((el) => ({
      el,
      y: Number(el.dataset.y),
      on: false,
    }));
    origin = host.parentElement!.getBoundingClientRect().top + scrollY;
    return true;
  };
  let tipShown = -1;
  let stale = true;
  host.addEventListener('runline:layout', () => {
    stale = true;
    tipShown = -1;
    follow(scrollY);
  });
  const follow = (scroll: number, again = false) => {
    if (again || stale || !svg || !svg.isConnected) {
      if (!read()) return;
      stale = false;
    }
    const tip = Math.max(top, Math.min(bottom, scroll + innerHeight * TIP - origin));
    if (Math.abs(tip - tipShown) < 0.5) return;
    tipShown = tip;
    const done = (tip - top) / Math.max(1, bottom - top);
    fill!.style.strokeDashoffset = String(1 - done);
    ball!.style.translate = `8px ${tip.toFixed(1)}px`;
    for (const node of nodes) {
      const on = tip >= node.y - 1;
      if (on !== node.on) node.el.classList.toggle('run-on', (node.on = on));
    }
  };
  return follow;
}
