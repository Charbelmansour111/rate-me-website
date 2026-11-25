/**
 * Browsers without scroll-driven animations: the scenes become one layer too, and fade from one to
 * the next as each group reaches the middle of the screen. Elsewhere motion.css does it all.
 */
export function startJourney(signal: AbortSignal) {
  if (CSS.supports('animation-timeline: view()')) return;
  const groups = [...document.querySelectorAll<HTMLElement>('[data-journey]')];
  if (!groups.length) return;
  const root = document.documentElement;
  root.dataset.journeyFallback = '';
  const seen = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const group = entry.target as HTMLElement;
        // Reached, or already passed: the later scene lies over the earlier one.
        group.toggleAttribute(
          'data-reached',
          entry.isIntersecting || entry.boundingClientRect.top < 0,
        );
      }
    },
    { rootMargin: '0px 0px -50% 0px' },
  );
  for (const group of groups) seen.observe(group);
  signal.addEventListener('abort', () => {
    seen.disconnect();
    delete root.dataset.journeyFallback;
  });
}
