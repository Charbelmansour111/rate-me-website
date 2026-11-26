import {
  fadeWindow,
  frameAt,
  frameUrl,
  journey,
  sceneAt,
  type Sequence,
  type Shape,
} from '@/config/journey.config';

const BATCH = 4;

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
 * The upper one fades in only within `window` of the midpoint between them (0.5: all the way).
 */
export function blend(frames: Iterable<number>, at: number, window = 0.5) {
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
  const along = (at - below) / (above - below);
  const alpha = Math.min(1, Math.max(0, (along - (0.5 - window)) / (2 * window)));
  return { from: below, to: above, alpha };
}

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
    /** Whether the work happens away from the page: then the next batch need not wait. */
    get offPage() {
      return worker !== undefined;
    },
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

/** The walk, for the scroll to drive: src/motion/rich.ts ties it to ScrollTrigger and Lenis. */
export type Walk = {
  /** Shows the walk at `progress` (0 to 1). */
  seek(progress: number): void;
  /** Where it is now, 0 to 1. */
  progress(): number;
  /** Where the walk ends: the scroll position of its last frame. */
  end(): number;
};

/**
 * Loads the image sequence and draws it where it is told to: the walk has no loop or scroll
 * listener of its own, so it moves in the same frame as the page. On any failure the still
 * pictures take over.
 */
export function startWalk(canvas: HTMLCanvasElement, signal: AbortSignal): Walk | undefined {
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
  const end = () => Math.max(1, page.offsetTop + page.offsetHeight - innerHeight);
  /** Along the walk, 0 to 1: until the scroll drives it, where the page was opened. */
  let position = Math.min(1, Math.max(0, scrollY / end()));
  const decoder = frameDecoder();

  /** What is on the canvas: the set, its two frames and the fade in 255ths (the finest shown). */
  let drawn = '';

  /** A frame over the whole canvas. The canvas is the frames' own size: CSS scales it. */
  function paint(frame: Frame, alpha: number) {
    context!.globalAlpha = alpha;
    context!.drawImage(frame.source, 0, 0, canvas.width, canvas.height);
  }

  /** Sets an attribute only when it changes: a write to <html> would restyle the page. */
  function mark(el: HTMLElement, key: string, value: string) {
    if (el.dataset[key] !== value) el.dataset[key] = value;
  }

  /**
   * The two frames around the position, the next one fading in by how far along it is. Nothing is
   * drawn when the picture would be the same, and one frame alone is one draw.
   */
  function draw() {
    if (reel.images.size) shown = reel;
    const { sequence, images } = shown;
    const mix = blend(images.keys(), position * (sequence.count - 1), fadeWindow(sequence.count));
    if (!mix) return;
    const below = images.get(mix.from)!;
    // Sized to the frames, not the screen: a turn or a resize redraws nothing.
    if (canvas.width !== below.width || canvas.height !== below.height) {
      canvas.width = below.width;
      canvas.height = below.height;
      drawn = '';
    }
    const fade = Math.round(mix.alpha * 255);
    // The set as well: turning the phone swaps it for one with the same frame numbers.
    const key = `${sequence.path} ${mix.from} ${mix.to} ${fade}`;
    if (key !== drawn) {
      drawn = key;
      if (fade === 255) paint(images.get(mix.to)!, 1);
      else {
        paint(below, 1);
        if (fade > 0) paint(images.get(mix.to)!, fade / 255);
      }
      context!.globalAlpha = 1;
      // The blend: the tests read it.
      canvas.dataset.blend = `${mix.from} ${mix.to} ${mix.alpha.toFixed(3)}`;
    }
    // Where the walk is, in frames; the frame mostly on show, the set, and the part of the walk.
    canvas.dataset.at = (position * (sequence.count - 1)).toFixed(3);
    mark(canvas, 'frame', String(nearest(images.keys(), frameAt(sequence, position))));
    mark(canvas, 'shape', sequence === journey.portrait ? 'portrait' : 'landscape');
    mark(root, 'scene', sceneAt(position));
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
    // It may be one of the two on show now.
    draw();
  }

  async function loadBatch(from: Reel) {
    // Turned away from: the rest waits until the screen turns back.
    if (signal.aborted || from !== reel) return;
    const frame = position * (from.sequence.count - 1);
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
    } else if (from.waiting.size) {
      // In a worker the page only receives finished bitmaps: straight on. Otherwise the decoding
      // is on the page, so it waits for a quiet moment.
      const next = () => void loadBatch(from);
      if (decoder.offPage) setTimeout(next, 0);
      else idle(next);
    }
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
    draw();
    void loadBatch(next);
  }

  pick();

  let width = innerWidth;
  function onResize() {
    // A keyboard that opens makes the screen wide, but not wider: that is no turn.
    if (innerWidth !== width) pick();
    width = innerWidth;
  }
  addEventListener('resize', onResize, { signal });

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
    decoder.stop();
    delete canvas.dataset.loaded;
    gaps.disconnect();
    delete root.dataset.journey;
    delete root.dataset.scene;
    delete canvas.dataset.frame;
    delete canvas.dataset.blend;
    delete canvas.dataset.at;
    delete canvas.dataset.shape;
    for (const { images } of reels.values()) for (const frame of images.values()) frame.close?.();
  });

  return {
    seek(progress) {
      position = progress;
      draw();
    },
    progress: () => position,
    end,
  };
}
