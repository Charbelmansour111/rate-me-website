'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import type { Dictionary } from '@/i18n';
import {
  DEFENDERS,
  mirror,
  ROLE_CHOICES,
  ROLE_SHAPES,
  translate,
  type Point,
  type RoleChoice,
} from '@/motion/tactics-data';

type Try = Dictionary['tactics']['try'];

/**
 * Role buttons under the whiteboard. A role stops the play and moves the three defenders into its
 * shape with GSAP (at once under reduced motion); Smart gives the board back to the play
 * (src/motion/tactics.ts, which waits while `data-role` is set). Arrows move between them.
 */
export function TacticsRoles({ t, rtl }: { t: Try; rtl: boolean }) {
  const [role, setRole] = useState<RoleChoice>('smart');
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const group = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    // Nothing to do until someone picks a role
    if (first.current) {
      first.current = false;
      return;
    }
    const root = group.current!.closest<HTMLElement>('[data-tactics]')!;
    const svg = root.querySelector('[data-stage] svg')!;
    const defenders = [...root.querySelectorAll<SVGGElement>('[data-defender]')];
    const home = DEFENDERS.map(({ at }) => at);
    const targets = role === 'smart' ? home : ROLE_SHAPES[role];
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (role === 'smart') delete root.dataset.role;
    else {
      root.dataset.role = role;
      // The whole board, still: the play's own movement stops where it is
      root.dataset.step = '2';
      for (const animation of svg.getAnimations({ subtree: true })) animation.cancel();
    }
    root.dispatchEvent(new Event('tactics:role'));

    // Where each defender is now, read from its transform
    const now = defenders.map((el, i): Point => {
      const matrix = new DOMMatrix(getComputedStyle(el).transform);
      return matrix.is2D && (matrix.e || matrix.f) ? [matrix.e, matrix.f] : mirror(home[i], rtl);
    });
    const place = (el: SVGGElement, point: Point) => {
      el.style.transform = translate(point);
    };
    if (calm) {
      defenders.forEach((el, i) => place(el, mirror(targets[i], rtl)));
      return;
    }
    let cancelled = false;
    let stop = () => {};
    void import('gsap').then(({ gsap }) => {
      if (cancelled) return;
      const tweens = defenders.map((el, i) => {
        const [x, y] = mirror(targets[i], rtl);
        const point = { x: now[i][0], y: now[i][1] };
        return gsap.to(point, {
          x,
          y,
          duration: 0.7,
          delay: i * 0.06,
          ease: 'power3.inOut',
          onUpdate: () => place(el, [point.x, point.y]),
        });
      });
      stop = () => tweens.forEach((tween) => tween.kill());
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [role, rtl]);

  function onKey(event: KeyboardEvent, i: number) {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    const to = { [forward]: i + 1, [back]: i - 1, Home: 0, End: ROLE_CHOICES.length - 1 }[
      event.key
    ];
    if (to === undefined) return;
    event.preventDefault();
    const next = (to + ROLE_CHOICES.length) % ROLE_CHOICES.length;
    setRole(ROLE_CHOICES[next]);
    buttons.current[next]?.focus();
  }

  return (
    <div ref={group} className="mt-5">
      <div role="group" aria-label={t.label} className="tactics-try">
        {ROLE_CHOICES.map((choice, i) => (
          <button
            key={choice}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            data-try={choice}
            aria-pressed={role === choice}
            tabIndex={role === choice ? 0 : -1}
            onClick={() => setRole(choice)}
            onKeyDown={(event) => onKey(event, i)}
          >
            {t.chips[choice]}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-3 min-h-14 text-lg text-muted">
        {t.captions[role]}
      </p>
    </div>
  );
}
