import {
  frameAt,
  frameUrl,
  journey,
  sceneAt,
  type Sequence,
  type Shape,
} from '@/config/journey.config';

/** How much of the way to the scroll the picture goes each 60th of a second: it eases, never snaps. */
const DAMPING = 0.1;
const BATCH = 4;
const MAX_DPR = 2;

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

/**
 * The two loaded frames either side of `at` (a frame number with a fraction, 0 to count - 1) and
 * how much of the upper one shows. One frame alone when `at` is on it or past the loaded ones.
 */
export function blend(frames: Iterable<number>, at: number) {
  let below: number | undefined;
  let above: number | undefined;
  for (const i of frames) {
    if (i <= at && (below === undefined || i > below)) below = i;
    if (i >= at && (above === undefined || i < above)) above = i;
  }
  if (below === undefined || above === undefined || below === above) {
    const only = below ?? above;
    return only === undefined ? undefined : { from: only, to: only, alpha: 0 };
  }
  return { from: below, to: above, alpha: (at - below) / (above - below) };
}

/** One step of easing towards `to`, the same at any frame rate. `ms` since the last step. */
export const damp = (from: number, to: number, ms: number, factor = DAMPING) =>
  from + (to - from) * (1 - (1 - factor) ** (ms / (1000 / 60)));

/** A frame, decoded. */
type Frame = { source: CanvasImageSource; width: number; height: number; close?: () => void };

/** Decodes a frame on the page, where there is no worker: the browser still decodes off-thread. */
async function decodeHere(url: string): Promise<Frame> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return { source: image, width: image.naturalWidth, height: image.naturalHeight };
}

const fromBitmap = (bitmap: ImageBitmap): Frame => ({
  source: bitmap,
  width: bitmap.width,
  height: bitmap.height,
  close: () => bitmap.close(),
});

/**
 * Fetches and decodes frames in a worker (src/motion/frames.worker.ts): the page only receives
 * whole bitmaps. Without workers or createImageBitmap, or if the worker cannot start, the frames
 * are decoded here instead.
 */
function frameDecoder() {
  const waiting = new Map<
    number,
    { url: string; resolve: (frame: Frame) => void; reject: () => void }
  >();
  let worker: Worker | undefined;
  let next = 0;
  try {
    if ('createImageBitmap' in window && 'Worker' in window) {
      worker = new Worker(new URL('./frames.worker.ts', import.meta.url), { type: 'module' });
    }
  } catch {
    worker = undefined;
  }
  worker?.addEventListener(
    'message',
    ({ data }: MessageEvent<{ id: number; bitmap?: ImageBitmap }>) => {
      const job = waiting.get(data.id);
      waiting.delete(data.id);
      if (!job) return data.bitmap?.close();
      if (data.bitmap) job.resolve(fromBitmap(data.bitmap));
      else job.reject();
    },
  );
  worker?.addEventListener('error', () => {
    worker?.terminate();
    worker = undefined;
    for (const { url, resolve, reject } of waiting.values()) decodeHere(url).then(resolve, reject);
    waiting.clear();
  });
  return {
    decode(url: string): Promise<Frame> {
      if (!worker) return decodeHere(url);
      const id = next++;
      return new Promise((resolve, reject) => {
        waiting.set(id, { url, resolve, reject });
        worker!.postMessage({ id, url });
      });
    },
    stop() {
      worker?.terminate();
      waiting.clear();
    },
  };
}

/** Which sequence a screen gets. */
export const shapeFor = (width: number, height: number, hasPortrait: boolean): Shape =>
  hasPortrait && height > width ? 'portrait' : 'landscape';

/** A sequence, what is loaded of it and what is still to come. */
type Reel = { sequence: Sequence; images: Map<number, Frame>; waiting: Set<number> };

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
  let last = 0;
  const decoder = frameDecoder();

  const progress = () => Math.min(1, Math.max(0, scrollY / range));

  /** A frame over the whole canvas, as `background-size: cover` would place it. */
  function paint(frame: Frame, alpha: number) {
    const { width, height } = canvas;
    const scale = Math.max(width / frame.width, height / frame.height);
    const w = frame.width * scale;
    const h = frame.height * scale;
    context!.globalAlpha = alpha;
    context!.drawImage(frame.source, (width - w) / 2, (height - h) / 2, w, h);
  }

  /** The two frames around the position, the next one fading in by how far along it is. */
  function draw() {
    if (reel.images.size) shown = reel;
    const { sequence, images } = shown;
    const at = position * (sequence.count - 1);
    const mix = blend(images.keys(), at);
    if (!mix) return;
    paint(images.get(mix.from)!, 1);
    if (mix.alpha > 0) paint(images.get(mix.to)!, mix.alpha);
    context!.globalAlpha = 1;
    // The frame mostly on show, and the blend: the tests read these.
    canvas.dataset.frame = String(nearest(images.keys(), frameAt(sequence, position)));
    canvas.dataset.blend = `${mix.from} ${mix.to} ${mix.alpha.toFixed(3)}`;
    canvas.dataset.shape = sequence === journey.portrait ? 'portrait' : 'landscape';
    root.dataset.scene = sceneAt(position);
  }

  function tick(now: number) {
    position = damp(position, target, Math.min(100, now - last));
    last = now;
    // Close enough: land on it, and stop until the next scroll.
    if (Math.abs(target - position) < 0.00005) position = target;
    draw();
    raf = position === target ? 0 : requestAnimationFrame(tick);
  }

  function onScroll() {
    target = progress();
    if (!raf && target !== position) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  function measure() {
    range = Math.max(1, page.offsetTop + page.offsetHeight - innerHeight);
    // The screen's pixel density, up to 2, but no finer than the frames themselves: past that
    // every scroll would fill more pixels with no more detail. A sharper set raises it by itself.
    const [first] = (reel.images.size ? reel : shown).images.values();
    const enough = first
      ? 1.25 * Math.min(first.height / canvas.clientHeight, first.width / canvas.clientWidth)
      : 1;
    const ratio = Math.min(devicePixelRatio || 1, MAX_DPR, enough);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      draw();
    }
    onScroll();
  }

  async function load(from: Reel, i: number) {
    from.waiting.delete(i);
    let frame: Frame;
    try {
      frame = await decoder.decode(frameUrl(from.sequence, i));
    } catch {
      return; // The frames either side stand in.
    }
    if (signal.aborted) return frame.close?.();
    from.images.set(i, frame);
    canvas.dataset.loaded = String(from.images.size);
    if (from !== reel) return;
    if (from.images.size === 1) measure();
    // It may be one of the two on show now.
    if (!raf) draw();
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
    decoder.stop();
    delete canvas.dataset.loaded;
    gaps.disconnect();
    delete root.dataset.journey;
    delete root.dataset.scene;
    delete canvas.dataset.frame;
    delete canvas.dataset.blend;
    delete canvas.dataset.shape;
    for (const { images } of reels.values()) for (const frame of images.values()) frame.close?.();
  });
}
