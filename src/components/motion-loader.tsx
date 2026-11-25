'use client';

import { useEffect } from 'react';

/** Loads the animation code after the page is ready, and never with reduced motion. */
export function MotionLoader() {
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let controller: AbortController | undefined;
    const update = () => {
      controller?.abort();
      controller = undefined;
      if (reduced.matches) return;
      const current = (controller = new AbortController());
      import('@/motion').then(
        ({ startMotion }) => {
          if (!current.signal.aborted) startMotion(current.signal);
        },
        () => {
          // Offline or blocked: the page is complete without it.
        },
      );
    };
    update();
    reduced.addEventListener('change', update);
    return () => {
      reduced.removeEventListener('change', update);
      controller?.abort();
    };
  }, []);
  return null;
}
