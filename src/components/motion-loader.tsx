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
      const load = () =>
        import('@/motion').then(
          ({ startMotion }) => {
            if (!current.signal.aborted) startMotion(current.signal);
          },
          () => {
            // Offline or blocked: the page is complete without it, with still pictures.
            document.documentElement.dataset.journey = 'off';
          },
        );
      // Once the page has settled (Safari has no idle callback).
      if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 1500 });
      else setTimeout(load, 300);
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
