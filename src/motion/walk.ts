import {
  frameAt,
  frameUrl,
  journey,
  sceneAt,
  type Sequence,
  type Shape,
} from '@/config/journey.config';

const EASE = 0.15;
const BATCH = 4;
const MAX_DPR = 2;
/** Between two frames the picture keeps growing by this much, so every bit of scroll shows. */
const STEP_ZOOM = 0.02;

const idle = (run: () => void) => {
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1000 });
  else setTimeout(run, 100);
};

/** The frames to fetch: all of them, or every second one to save data. */
export const frameList = ({ count }: Sequence, saveData: boolean) =>
  Array.from({ length: count }, (_, i) => i).filter((i) => !saveData || i % 2 === 0);

/** The one closest to `frame`; the earlier one when two are as close. */
export const nearest = (frames: Iterable<number>, frame: number) => {
  let best: number | undefined;
  for (const i of frames) {
    if (best === undefined || Math.abs(i - frame) < Math.abs(best - frame)) best = i;
  }
  return best;
};

/** Which sequence a screen gets. */
export const shapeFor = (width: number, height: number, hasPortrait: boolean): Shape =>
  hasPortrait && height > width ? 'portrait' : 'landscape';

/** A sequence, what is loaded of it and what is still to come. */
type Reel = { sequence: Sequence; images: Map<number, HTMLImageElement>; waiting: Set<number> };

/** Scrubs the image sequence with the scroll. On any failure the still pictures take over. */
export function startWalk(canvas: HTMLCanvasElement, signal: AbortSignal) {
  const root = document.documentElement;
  const page = canvas.parentElement!;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    root.dataset.journey = 'off';
    return;
  }
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const saveData = Boolean(connection?.saveData);
  /** Both are kept, so turning the phone back loads nothing twice. */
  const reels = new Map<Shape, Reel>();
  let hasPortrait = canvas.dataset.portrait !== undefined;
  /** The sequence for this screen, and the one on show: the old one, until the new one starts. */
  let reel: Reel;
  let shown: Reel;
  const gapEls = [...document.querySelectorAll<HTMLElement>('[data-walk-gap]')];
  let range = 1;
  /** Along the walk, 0 to 1. */
  let target = 0;
  let position = 0;
  let raf = 0;

  const progress = () => Math.min(1, Math.max(0, scrollY / range));

  function draw() {
    if (reel.images.size) shown = reel;
    const { sequence, images } = shown;
    const i = nearest(images.keys(), frameAt(sequence, position));
    if (i === undefined) return;
    const image = images.get(i)!;
    const at = position * (sequence.count - 1);
    const { width, height } = canvas;
    const part = Math.max(-0.5, Math.min(0.5, at - i)) + Math.min(0.5, at);
    const scale =
      Math.max(width / image.naturalWidth, height / image.naturalHeight) *
      (1 + STEP_ZOOM * Math.max(0, part));
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    context!.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
    canvas.dataset.frame = String(i);
    canvas.dataset.shape = sequence === journey.portrait ? 'portrait' : 'landscape';
    root.dataset.scene = sceneAt(position);
  }

  function tick() {
    position += (target - position) * EASE;
    // Close enough: land on it, and stop until the next scroll.
    if (Math.abs(target - position) < 0.0001) position = target;
    draw();
    raf = position === target ? 0 : requestAnimationFrame(tick);
  }

  function onScroll() {
    target = progress();
    if (!raf && target !== position) raf = requestAnimationFrame(tick);
  }

  function measure() {
    range = Math.max(1, page.offsetTop + page.offsetHeight - innerHeight);
    // Many more pixels than the pictures have would only cost time: the browser scales up for free.
    const [first] = (reel.images.size ? reel : shown).images.values();
    const enough = first
      ? 1.25 *
        Math.min(first.naturalHeight / canvas.clientHeight, first.naturalWidth / canvas.clientWidth)
      : 1;
    const ratio = Math.min(devicePixelRatio || 1, MAX_DPR, enough);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      draw();
    }
    // Each scene is named once, in the first gap that shows it.
    const named = new Set<string>();
    for (const gap of gapEls) {
      const { top, height } = gap.getBoundingClientRect();
      const middle = top + scrollY + height / 2 - innerHeight / 2;
      const scene = sceneAt(Math.min(1, Math.max(0, middle / range)));
      gap.dataset.name = named.has(scene) ? '' : scene;
      named.add(scene);
    }
    onScroll();
  }

  async function load(from: Reel, i: number) {
    from.waiting.delete(i);
    const image = new Image();
    image.decoding = 'async';
    image.src = frameUrl(from.sequence, i);
    try {
      await image.decode();
    } catch {
      return; // The nearest other frame stands in.
    }
    const best = () => nearest(from.images.keys(), frameAt(from.sequence, position));
    const before = best();
    from.images.set(i, image);
    if (signal.aborted || from !== reel) return;
    if (from.images.size === 1) measure();
    if (best() !== before && !raf) draw();
  }

  async function loadBatch(from: Reel) {
    // Turned away from: the rest waits until the screen turns back.
    if (signal.aborted || from !== reel) return;
    const frame = target * (from.sequence.count - 1);
    const batch: Promise<void>[] = [];
    while (batch.length < BATCH && from.waiting.size) {
      batch.push(load(from, nearest(from.waiting, frame)!));
    }
    await Promise.all(batch);
    if (signal.aborted || from !== reel) return;
    if (!from.images.size) {
      if (from.sequence !== journey.portrait) {
        root.dataset.journey = 'off';
        return;
      }
      hasPortrait = false;
      pick();
    } else if (from.waiting.size) idle(() => void loadBatch(from));
  }

  /** Takes the sequence for this screen. Says whether that is another one than before. */
  function pick() {
    const shape = shapeFor(innerWidth, innerHeight, hasPortrait);
    let next = reels.get(shape);
    if (!next) {
      const sequence = journey[shape];
      next = { sequence, images: new Map(), waiting: new Set(frameList(sequence, saveData)) };
      reels.set(shape, next);
    }
    if (next === reel) return;
    reel = next;
    shown ??= next;
    measure();
    draw();
    void loadBatch(next);
  }

  pick();
  position = target;

  let width = innerWidth;
  function onResize() {
    // A keyboard that opens makes the screen wide, but not wider: that is no turn.
    if (innerWidth !== width) pick();
    width = innerWidth;
    measure();
  }
  addEventListener('scroll', onScroll, { signal, passive: true });
  addEventListener('resize', onResize, { signal });
  // Opening an answer or a form step changes how long the walk is.
  const resized = new ResizeObserver(measure);
  resized.observe(page);

  const gaps = new IntersectionObserver(
    (entries) => {
      for (const { target: gap, isIntersecting } of entries) {
        gap.toggleAttribute('data-in', isIntersecting);
      }
    },
    { rootMargin: '-20% 0px' },
  );
  for (const gap of gapEls) gaps.observe(gap);
  root.dataset.journey = 'on';

  signal.addEventListener('abort', () => {
    cancelAnimationFrame(raf);
    resized.disconnect();
    gaps.disconnect();
    delete root.dataset.journey;
    delete root.dataset.scene;
    delete canvas.dataset.frame;
    delete canvas.dataset.shape;
  });
}
