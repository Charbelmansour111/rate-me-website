import { gsap } from 'gsap';

/**
 * "Coach view | Player view": the orange pill glides to the tab that is chosen. Without this the
 * chosen tab simply has the orange background (src/app/journey.css).
 */
export function startTabGlide(signal: AbortSignal) {
  for (const list of document.querySelectorAll<HTMLElement>('[data-glide]')) {
    const pill = document.createElement('span');
    pill.className = 'tab-pill';
    pill.setAttribute('aria-hidden', 'true');
    list.prepend(pill);
    list.toggleAttribute('data-gliding', true);

    const place = (animate: boolean) => {
      const tab = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!tab) return;
      // Measured within the list, which is the pill's containing block: the same left to right.
      const to = {
        x: tab.offsetLeft,
        y: tab.offsetTop,
        width: tab.offsetWidth,
        height: tab.offsetHeight,
      };
      if (animate) gsap.to(pill, { ...to, duration: 0.45, ease: 'power3.out', overwrite: true });
      else gsap.set(pill, to);
    };
    place(false);
    const chosen = new MutationObserver(() => place(true));
    chosen.observe(list, { subtree: true, attributeFilter: ['aria-selected'] });
    const resized = new ResizeObserver(() => place(false));
    resized.observe(list);

    signal.addEventListener('abort', () => {
      chosen.disconnect();
      resized.disconnect();
      gsap.killTweensOf(pill);
      pill.remove();
      list.removeAttribute('data-gliding');
    });
  }
}
