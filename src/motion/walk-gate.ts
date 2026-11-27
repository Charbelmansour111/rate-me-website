import { loading } from '@/config/journey.config';

import type { Walk } from './walk';

/** The keys that scroll the page: held while the intro is up. */
const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']);

/**
 * A first visit's intro (WEBSITE 25): the walk plays like a video only once its frames are here, so
 * on a first visit the Rate Me mark and a thin line, filling as they come, stand over the page
 * until every `loading.introEvery`-th frame of the set and those round the walk are in; the rest of
 * the set and tier 2 come in behind, the walk thinner where they have not come yet. Never longer
 * than `loading.introCap` ms from the page's start, and "Skip" lets anyone in at once.
 *
 * Whether there is one is decided before the first paint (src/config/journey.config.ts,
 * INTRO_SCRIPT), which sets <html data-walk-gate="open">: not on a return visit, to save data or
 * under reduced motion. The page is painted under it all along (its first paint and largest text are
 * the page's own). It says how it went on <html data-walk-gate> (open, done, capped, skipped, none)
 * and, closed, how long it was open in data-walk-gate-ms.
 */
export function gateWalk(walk: Walk, signal: AbortSignal) {
  const root = document.documentElement;
  const panel = document.querySelector<HTMLElement>('[data-walk-wait]');
  if (!panel || root.dataset.walkGate !== 'open' || walk.known()) {
    if (root.dataset.walkGate === 'open') root.dataset.walkGate = 'none';
    else root.dataset.walkGate ??= 'none';
    return;
  }
  const box = panel;
  const bar = panel.querySelector<HTMLElement>('[role="progressbar"]')!;
  const skip = panel.querySelector<HTMLButtonElement>('[data-walk-gate-skip]')!;

  // Hold the page still: the wheel, a finger (one: pinching to zoom stays free) and the scroll keys
  const lock = new AbortController();
  const hold = (event: Event) => {
    if ('touches' in event && (event as TouchEvent).touches.length > 1) return;
    if (event instanceof KeyboardEvent) {
      if (!SCROLL_KEYS.has(event.key)) return;
      // Space and Enter press the button when it has the focus
      if (event.target === skip) return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  for (const type of ['wheel', 'touchmove', 'keydown']) {
    addEventListener(type, hold, { capture: true, passive: false, signal: lock.signal });
  }
  // The page behind it is out of reach while it is up: the first Tab lands on Skip
  const behind: HTMLElement[] = [];
  for (let el: HTMLElement | null = box; el && el !== document.body; el = el.parentElement) {
    for (const sibling of el.parentElement?.children ?? []) {
      if (sibling !== el && sibling instanceof HTMLElement && !sibling.inert) behind.push(sibling);
    }
  }
  for (const el of behind) el.inert = true;

  /** The intro is on screen from the first paint: its time counts from the page's start. */
  walk.fetchNow();

  let timer = 0;
  function close(how: 'done' | 'capped' | 'skipped') {
    if (lock.signal.aborted) return;
    lock.abort();
    clearInterval(timer);
    for (const el of behind) el.inert = false;
    root.dataset.walkGate = how;
    root.dataset.walkGateMs = String(Math.round(performance.now()));
    const focused = document.activeElement === skip;
    box.dataset.closing = '';
    setTimeout(() => {
      box.hidden = true;
      delete box.dataset.closing;
    }, 500);
    // The button goes: the focus goes to the page, where the next Tab starts
    if (focused) {
      const main = document.getElementById('main');
      main?.setAttribute('tabindex', '-1');
      main?.focus({ preventScroll: true });
    }
  }
  skip.addEventListener('click', () => close('skipped'), { signal: lock.signal });

  let shown = -1;
  const check = () => {
    const { held, total, ready } = walk.held();
    // The frames are most of the wait; the frames round the walk decoded, the last few per cent
    const done = Math.min(100, Math.floor((95 * held) / Math.max(1, total)) + (ready ? 5 : 0));
    if (done !== shown) {
      shown = done;
      bar.style.setProperty('--done', String(done / 100));
      bar.setAttribute('aria-valuenow', String(done));
    }
    if (held >= total && ready) close('done');
    else if (performance.now() >= loading.introCap) close('capped');
  };
  timer = window.setInterval(check, 100);
  check();

  signal.addEventListener('abort', () => {
    lock.abort();
    clearInterval(timer);
    for (const el of behind) el.inert = false;
    panel.hidden = true;
    delete root.dataset.walkGate;
  });
}
