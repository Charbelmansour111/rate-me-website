/**
 * Scroll reveals. Content is visible at rest: an element is only hidden ("armed") during the last
 * bit of scrolling before it enters, and only by a paused animation. No JavaScript, a fast jump,
 * a crawler or a screen reader all find the page as it is.
 */
const ARM = 200;
const STAGGER = 70;
const EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

const RISE: Keyframe[] = [{ opacity: 0, transform: 'translateY(20px)' }, {}];

function build(el: HTMLElement | SVGElement, delay: number): Animation[] {
  const make = (target: Element, frames: Keyframe[], duration: number, extra = 0, easing = EASE) =>
    target.animate(frames, { duration, delay: delay + extra, easing, fill: 'backwards' });
  const within = (selector: string) => [...el.querySelectorAll(selector)];

  switch (el.dataset.reveal) {
    case 'draw':
      return within('path').map((path, i) =>
        make(
          path,
          [
            { strokeDasharray: '1', strokeDashoffset: 1 },
            { strokeDasharray: '1', strokeDashoffset: 0 },
          ],
          1400,
          i * 200,
          'ease-in-out',
        ),
      );
    case 'step':
      return [
        make(el.lastElementChild!, RISE, 500),
        ...within('[data-number]').map((number) =>
          make(number, [{ backgroundColor: 'transparent', color: 'var(--text)' }, {}], 400, 150),
        ),
        ...within('[data-connector]').map((line) =>
          make(line, [{ transform: 'scaleY(0)' }, {}], 500, 350),
        ),
      ];
    case 'fade':
      return [make(el, [{ opacity: 0, transform: 'translateY(8px)' }, {}], 300)];
    default:
      return [
        make(el, RISE, 600),
        ...within('[data-pop]').map((pop) =>
          make(pop, [{ transform: 'scale(0.4)' }, {}], 600, 120, 'cubic-bezier(0.3, 1.6, 0.5, 1)'),
        ),
      ];
  }
}

export function startReveals(signal: AbortSignal) {
  const armed = new Map<Element, Animation[]>();
  const done = new WeakSet<Element>();

  const arm = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting, boundingClientRect } of entries) {
        if (done.has(target)) continue;
        if (!isIntersecting) {
          // Scrolled away again before it came in: visible at rest.
          if (armed.has(target)) {
            for (const animation of armed.get(target)!) animation.cancel();
            armed.delete(target);
          }
        } else if (boundingClientRect.top >= innerHeight) {
          const animations = build(target as HTMLElement, 0);
          for (const animation of animations) animation.pause();
          armed.set(target, animations);
        } else {
          // Already on screen: never hide something that is being looked at.
          done.add(target);
        }
      }
    },
    { rootMargin: `0px 0px ${ARM}px 0px` },
  );

  const enter = new IntersectionObserver(
    (entries) => {
      let order = 0;
      for (const { target, isIntersecting } of entries) {
        const animations = armed.get(target);
        if (!isIntersecting || !animations || done.has(target)) continue;
        const index = order++;
        for (const animation of animations) {
          const { delay = 0 } = animation.effect!.getTiming();
          // Steps light up one after the other, the rest comes in as a quick stagger.
          const gap = (target as HTMLElement).dataset.reveal === 'step' ? 450 : STAGGER;
          animation.effect!.updateTiming({ delay: delay + index * gap });
          animation.play();
        }
        done.add(target);
        armed.delete(target);
        arm.unobserve(target);
        enter.unobserve(target);
      }
    },
    { rootMargin: '0px 0px -24px 0px' },
  );

  for (const el of document.querySelectorAll('[data-reveal]')) {
    arm.observe(el);
    enter.observe(el);
  }

  const release = () => {
    for (const animations of armed.values()) for (const a of animations) a.cancel();
    armed.clear();
  };
  addEventListener('beforeprint', release, { signal });
  signal.addEventListener('abort', () => {
    arm.disconnect();
    enter.disconnect();
    release();
  });
}

/** Browsers that cannot transition <details> in CSS: open it with a short animation. */
export function startDetails(signal: AbortSignal) {
  if (CSS.supports('interpolate-size', 'allow-keywords')) return;
  for (const details of document.querySelectorAll('details')) {
    details.addEventListener(
      'toggle',
      () => {
        const body = details.lastElementChild;
        if (!details.open || !body) return;
        const height = `${body.getBoundingClientRect().height}px`;
        body.animate(
          [
            { height: '0px', overflow: 'hidden' },
            { height, overflow: 'hidden' },
          ],
          { duration: 250, easing: 'ease-out' },
        );
      },
      { signal },
    );
  }
}
