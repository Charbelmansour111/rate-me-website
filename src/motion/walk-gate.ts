import type { Walk } from './walk';

/** The keys that scroll the page: held while the gate is open. */
const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']);

/**
 * A first visit's short wait (WEBSITE 24): the walk plays like a video only once its frames are
 * here, so on a first visit, with nothing in the cache, a small panel where the scroll cue sits
 * says it is getting ready, with how far along it is, and the page holds still until the frames
 * round the top are decoded and the whole set is held. The page itself is there all along (it is
 * painted before this code even loads), and "Skip the wait" lets anyone in at once.
 *
 * No gate: on a return visit (the set is in the Cache API), to save data (the set is never fetched
 * whole), and under reduced motion (this code does not run; the walk is still pictures). It says
 * how it went on <html data-walk-gate> (open, done, skipped, none) and, closed, how long it was
 * open in data-walk-gate-ms.
 */
export function gateWalk(walk: Walk, signal: AbortSignal) {
  const root = document.documentElement;
  const panel = document.querySelector<HTMLElement>('[data-walk-wait]');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (!panel || connection?.saveData || walk.known()) {
    root.dataset.walkGate = 'none';
    return;
  }
  const box = panel;
  const bar = panel.querySelector<HTMLElement>('[role="progressbar"]')!;
  const pct = panel.querySelector<HTMLElement>('.walk-gate-pct')!;
  const skip = panel.querySelector<HTMLButtonElement>('[data-walk-gate-skip]')!;

  // Hold the page still: the wheel, a finger (one: pinching to zoom stays free) and the scroll keys
  const lock = new AbortController();
  const hold = (event: Event) => {
    if ('touches' in event && (event as TouchEvent).touches.length > 1) return;
    if (event instanceof KeyboardEvent) {
      if (!SCROLL_KEYS.has(event.key)) return;
      // Space presses the button when it has the focus
      if (event.key === ' ' && event.target === skip) return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  for (const type of ['wheel', 'touchmove', 'keydown']) {
    addEventListener(type, hold, { capture: true, passive: false, signal: lock.signal });
  }

  const opened = performance.now();
  panel.hidden = false;
  root.dataset.walkGate = 'open';
  walk.fetchNow();

  let timer = 0;
  function close(how: 'done' | 'skipped') {
    if (lock.signal.aborted) return;
    lock.abort();
    clearInterval(timer);
    root.dataset.walkGate = how;
    root.dataset.walkGateMs = String(Math.round(performance.now() - opened));
    const focused = document.activeElement === skip;
    box.dataset.closing = '';
    setTimeout(() => {
      box.hidden = true;
      delete box.dataset.closing;
    }, 300);
    // The button goes: the focus goes to the page, where the next Tab starts
    if (focused) {
      const main = document.getElementById('main');
      main?.setAttribute('tabindex', '-1');
      main?.focus({ preventScroll: true });
    }
  }
  skip.addEventListener('click', () => close('skipped'), { signal: lock.signal });

  let shown = -1;
  timer = window.setInterval(() => {
    const { held, total, ready } = walk.held();
    // The set is most of the wait; the frames round the top the last few per cent
    const done = Math.min(100, Math.floor((95 * held) / Math.max(1, total)) + (ready ? 5 : 0));
    if (done !== shown) {
      shown = done;
      bar.style.setProperty('--done', String(done / 100));
      bar.setAttribute('aria-valuenow', String(done));
      pct.textContent = `${done}%`;
    }
    if (held >= total && ready) close('done');
  }, 120);

  signal.addEventListener('abort', () => {
    lock.abort();
    clearInterval(timer);
    panel.hidden = true;
    delete root.dataset.walkGate;
  });
}
