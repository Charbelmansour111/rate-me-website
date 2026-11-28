/**
 * What follows the page as a whole, without GSAP (WEBSITE 27): the header's progress line, the dim
 * over the end of the walk, the running line down the edge. On a computer ScrollTrigger drives it
 * (src/motion/chrome.ts); on a phone the drawing's own scroll loop does (src/motion/pitch-walk.ts),
 * so a phone runs no ScrollTrigger at all.
 */

/** The last part of the page over which the walk dims and the footer arrives. */
export const END = 0.12;
/** How dark the walk gets at the very end: brightness 1 to 0.45, as a black layer over it. */
const DIM = 0.55;
/** Where the tip of the running line is, down the screen. */
const TIP = 0.55;

/**
 * Returns what to call with the page's progress (0 to 1) and scroll (px) each frame it moves, and
 * `again` when the layout changed. Every style is written only when it changes: a style written
 * every frame, even the same value, restyles its element and makes its layer commit again.
 */
export function followPage() {
  // The progress line itself, not a custom property on the header: a property set on the bar
  // restyles all of the header on every scrolled frame (WEBSITE 19); a transform on the line is
  // drawn by the compositor alone
  const bar = document.querySelector<HTMLElement>('.site-bar-progress');
  const dim = document.querySelector<HTMLElement>('[data-walk-dim]');
  const line = startRunningLine();
  let barShown = '';
  let dimShown = '';
  const follow = (progress: number, scroll: number, again = false) => {
    const scale = `scaleX(${progress.toFixed(3)})`;
    if (bar && scale !== barShown) bar.style.transform = barShown = scale;
    const shade = (DIM * Math.max(0, (progress - (1 - END)) / END)).toFixed(3);
    if (dim && shade !== dimShown) dim.style.opacity = dimShown = shade;
    line?.(scroll, again);
  };
  follow.stop = () => {
    bar?.style.removeProperty('transform');
    dim?.style.removeProperty('opacity');
  };
  return follow;
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
  let fill: HTMLElement | null = null;
  let ball: SVGSVGElement | null = null;
  let origin = 0;
  const read = () => {
    svg = host.querySelector('svg');
    if (!svg) return false;
    top = Number(svg.dataset.top);
    bottom = Number(svg.dataset.bottom);
    fill = host.querySelector('.run-bar');
    ball = host.querySelector('.run-ball');
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
    if (Math.abs(tip - tipShown) < 1) return;
    tipShown = tip;
    const done = (tip - top) / Math.max(1, bottom - top);
    if (fill) fill.style.transform = `scaleY(${done.toFixed(4)})`;
    if (ball) ball.style.transform = `translate3d(0, ${(tip - 8).toFixed(1)}px, 0)`;
    for (const node of nodes) {
      const on = tip >= node.y - 1;
      if (on !== node.on) node.el.classList.toggle('run-on', (node.on = on));
    }
  };
  return follow;
}
