import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { riseWords } from '@/components/react-bits/split-text.motion';

/**
 * Scroll reveals, on ScrollTrigger. Content is visible at rest: an element is only hidden
 * ("armed") during the last bit of scrolling before it enters, and is shown again if the page goes
 * back up first. No JavaScript, a fast jump, a crawler or a screen reader all find the page as it
 * is; what was on screen when this started is never hidden.
 */
const ARM = 200;
const STAGGER = 0.07;
/** Steps light up one after the other. */
const STEP_GAP = 0.45;
const EASE = 'power3.out';
/** What a reveal touches, given back to the stylesheet when it is done. */
const PROPS = 'opacity,transform,backgroundColor,color';

/** The reveal for `el`, paused, and what undoes anything it changed in the page. */
function build(el: HTMLElement): { tl: gsap.core.Timeline; undo?: () => void } {
  const tl = gsap.timeline({ paused: true });
  const within = (selector: string) => gsap.utils.toArray<Element>(selector, el);
  switch (el.dataset.reveal) {
    case 'step': {
      const text = getComputedStyle(el).getPropertyValue('--text').trim();
      tl.from(el.lastElementChild, { opacity: 0, y: 20, duration: 0.5, ease: EASE }, 0);
      const numbers = within('[data-number]');
      if (numbers.length) {
        tl.from(numbers, { backgroundColor: 'transparent', color: text, duration: 0.4 }, 0.15);
      }
      const lines = within('[data-connector]');
      if (lines.length) tl.from(lines, { scaleY: 0, duration: 0.5, ease: EASE }, 0.35);
      break;
    }
    case 'fade':
      tl.from(el, { opacity: 0, y: 8, duration: 0.3, ease: EASE });
      break;
    default: {
      // Section headings come in word by word (React Bits SplitText).
      if (el.matches('h2')) return { tl, undo: riseWords(el, tl) };
      tl.from(el, { opacity: 0, y: 20, duration: 0.6, ease: EASE });
      const pops = within('[data-pop]');
      if (pops.length) tl.from(pops, { scale: 0.4, duration: 0.6, ease: 'power3.out' }, 0.12);
    }
  }
  return { tl };
}

export function startReveals(signal: AbortSignal) {
  const armed = new Map<HTMLElement, ReturnType<typeof build>>();
  const done = new WeakSet<Element>();
  const targets = (el: HTMLElement) => [
    el,
    ...el.querySelectorAll('[data-number], [data-connector], [data-pop]'),
  ];

  /** Visible for good, as the stylesheet has it. */
  const release = (el: HTMLElement) => {
    const reveal = armed.get(el);
    reveal?.tl.kill();
    reveal?.undo?.();
    armed.delete(el);
    gsap.set(targets(el), { clearProps: PROPS });
  };

  const waiting = gsap.utils
    .toArray<HTMLElement>('[data-reveal]')
    // Already on screen: never hide something that is being looked at.
    .filter((el) => el.getBoundingClientRect().top >= innerHeight);

  const armTriggers = new Map<HTMLElement, ScrollTrigger>();
  const triggers = waiting.map((el) => {
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: `top bottom+=${ARM}`,
      onEnter: () => {
        if (done.has(el) || armed.has(el)) return;
        armed.set(el, build(el));
      },
      // Back up before it came in: visible at rest.
      onLeaveBack: () => {
        if (!done.has(el)) release(el);
      },
    });
    armTriggers.set(el, trigger);
    return trigger;
  });

  const batches = ScrollTrigger.batch(waiting, {
    start: 'top bottom-=24',
    once: true,
    onEnter: (entered) => {
      // The rest comes in as a quick stagger, steps one after the other.
      (entered as HTMLElement[]).forEach((el, index) => {
        done.add(el);
        // Come in for good: its trigger has nothing left to watch (WEBSITE 26)
        armTriggers.get(el)?.kill();
        armTriggers.delete(el);
        const tl = armed.get(el)?.tl;
        if (!tl) return;
        // Jumped past it: nothing to watch.
        if (el.getBoundingClientRect().bottom < 0) return release(el);
        const gap = el.dataset.reveal === 'step' ? STEP_GAP : STAGGER;
        tl.eventCallback('onComplete', () => release(el));
        gsap.delayedCall(index * gap, () => tl.play());
      });
    },
  });

  const showAll = () => {
    for (const el of [...armed.keys()]) release(el);
  };
  addEventListener('beforeprint', showAll, { signal });
  signal.addEventListener('abort', () => {
    for (const trigger of [...triggers, ...batches]) trigger.kill();
    showAll();
  });
}
