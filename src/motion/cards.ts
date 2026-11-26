import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** The most a card leans towards the mouse, in degrees. */
const TILT = 4;

/**
 * Under a mouse: a light follows the cursor over each card (src/components/react-bits) and the
 * card leans a little towards it. Touch screens and pens get the reveal only.
 */
export function startSpotlights(signal: AbortSignal) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const root = document.documentElement;
  for (const card of document.querySelectorAll<HTMLElement>('[data-spotlight]')) {
    // The light under the content, and the rim over it (src/components/react-bits)
    const layer = (name: string) => {
      const span = document.createElement('span');
      span.className = name;
      span.setAttribute('aria-hidden', 'true');
      return span;
    };
    const light = layer('spotlight-light');
    const rim = layer('spotlight-rim');
    card.prepend(light);
    card.append(rim);
    signal.addEventListener('abort', () => {
      light.remove();
      rim.remove();
    });
    gsap.set(card, { transformPerspective: 900 });
    const follow = { duration: 0.35, ease: 'power3.out' };
    const x = gsap.quickTo(card, '--spot-x', follow);
    const y = gsap.quickTo(card, '--spot-y', follow);
    const on = gsap.quickTo(card, '--spot-on', { duration: 0.3, ease: 'power2.out' });
    const leanX = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    const leanY = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    let entered = false;

    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      // The browser sends moves as the page glides under a still mouse: the light waits.
      if (root.classList.contains('lenis-smooth')) return;
      const box = card.getBoundingClientRect();
      const px = event.clientX - box.left;
      const py = event.clientY - box.top;
      // Coming in: the light starts where the mouse is, it does not slide in from a corner.
      if (!entered) {
        entered = true;
        x(px, px);
        y(py, py);
      } else {
        x(px);
        y(py);
      }
      on(1);
      leanX(((px / box.width) * 2 - 1) * TILT);
      leanY(-((py / box.height) * 2 - 1) * TILT);
    };
    const leave = () => {
      entered = false;
      on(0);
      leanX(0);
      leanY(0);
    };
    card.addEventListener('pointermove', move, { signal });
    card.addEventListener('pointerleave', leave, { signal });
  }
}

/**
 * Cards rise in, one after the other, as they come into view. Only cards still below the screen
 * wait; their text stays readable to assistive tech (opacity only, never hidden).
 */
export function startCardReveals(signal: AbortSignal) {
  const waiting = gsap.utils
    .toArray<HTMLElement>('[data-card-reveal]')
    .filter((card) => card.getBoundingClientRect().top > innerHeight);
  if (!waiting.length) return;
  gsap.set(waiting, { opacity: 0, y: 32 });
  const show = (cards: Element[]) =>
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.75,
      ease: 'power3.out',
      stagger: 0.1,
      overwrite: true,
      clearProps: 'opacity,transform',
    });
  ScrollTrigger.batch(waiting, { start: 'top 92%', once: true, onEnter: show });
  // Printing shows everything.
  addEventListener('beforeprint', () => gsap.set(waiting, { clearProps: 'opacity,transform' }), {
    signal,
  });
}

/** The phones beside the one in front float at their own speed while the section passes. */
export function startParallax() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 64rem)', () => {
    // The section, not the track: the hidden view's track measures nothing.
    const section = document.getElementById('inside');
    if (!section) return;
    for (const view of section.querySelectorAll<HTMLElement>('.showcase-track')) {
      const phones = [...view.querySelectorAll<HTMLElement>('[data-parallax]')];
      const middle = (phones.length - 1) / 2;
      phones.forEach((phone, i) => {
        // The one in front holds still; the ones beside it drift, each at its own pace.
        const depth = i === middle ? 0 : i < middle ? 1 : 1.5;
        if (!depth) return;
        gsap.fromTo(
          phone,
          { y: 32 * depth },
          {
            y: -32 * depth,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          },
        );
      });
    }
  });
  return mm;
}
