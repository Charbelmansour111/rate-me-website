import {
  fadeWindow,
  frameAt,
  frameUrl,
  journey,
  loading,
  sceneAt,
  type Sequence,
  type Shape,
} from '@/config/journey.config';

import { blend, frameList, nearest, strideFor, wanted } from './walk-frames';

export { blend, frameList, nearest, strideFor, wanted };

/** Frames asked for at a time: a dense set must not take a minute to come in. */
const BATCH = 12;

const idle = (run: () => void) => {
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1000 });
  else setTimeout(run, 100);
};

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

/**
 * A sequence: the frames it can show at its stride, those decoded, those on their way, and whether
 * a run of batches is going.
 */
type Reel = {
  sequence: Sequence;
  stride: number;
  all: number[];
  images: Map<number, Frame>;
  pending: Set<number>;
  busy: boolean;
};

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
  /** Nothing is fetched until the page has loaded and painted (see `afterPaint` below). */
  let started = false;
  /** The frame the kept window was last centred on. */
  let centre = -Infinity;
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

  /** Where the walk is on a reel, in frames. */
  const frameOf = (from: Reel) => position * (from.sequence.count - 1);

  /** Says, for the tests, whether every frame around the walk's position is in. */
  function markReady(from: Reel) {
    const missing = wanted(from.all, frameOf(from)).some((i) => !from.images.has(i));
    mark(canvas, 'ready', missing ? 'false' : 'true');
    canvas.dataset.loaded = String(from.images.size);
  }

  async function load(from: Reel, i: number) {
    from.pending.add(i);
    let frame: Frame;
    try {
      frame = await decoder.decode(frameUrl(from.sequence, i));
    } catch {
      return; // The frames either side stand in.
    } finally {
      from.pending.delete(i);
    }
    if (signal.aborted) return frame.close?.();
    // Left behind while it was on its way: not needed now
    if (!wanted(from.all, frameOf(from)).includes(i)) return frame.close?.();
    from.images.set(i, frame);
    if (from !== reel) return;
    // Drawn only if it is one of the two on show, or the first: the rest wait for the scroll.
    if (from.images.size === 1 || Math.abs(i - frameOf(from)) <= from.stride) draw();
  }

  /** The frames still to come around the position: the nearest first, the anchors after. */
  function toLoad(from: Reel) {
    const at = frameOf(from);
    const close = (i: number) => Math.abs(i - at) <= loading.window;
    return wanted(from.all, at)
      .filter((i) => !from.images.has(i) && !from.pending.has(i))
      .sort((a, b) => Number(close(b)) - Number(close(a)) || Math.abs(a - at) - Math.abs(b - at));
  }

  async function loadBatch(from: Reel) {
    // Turned away from: the rest waits until the screen turns back.
    if (signal.aborted || from !== reel) {
      from.busy = false;
      return;
    }
    from.busy = true;
    await Promise.all(
      toLoad(from)
        .slice(0, BATCH)
        .map((i) => load(from, i)),
    );
    if (signal.aborted || from !== reel) {
      from.busy = false;
      return;
    }
    markReady(from);
    if (!from.images.size) {
      from.busy = false;
      if (from.sequence !== journey.portrait) {
        root.dataset.journey = 'off';
        return;
      }
      hasPortrait = false;
      pick();
    } else if (toLoad(from).length) {
      // The next batch in a quiet moment, so loading never holds up the page
      idle(() => void loadBatch(from));
    } else from.busy = false;
  }

  /**
   * Keeps the window round the position: lets go of the frames it has left (their bitmaps
   * closed) and loads those it has come to. Run as the walk moves, every few frames.
   */
  function follow() {
    if (!started) return;
    const from = reel;
    const at = frameOf(from);
    if (Math.abs(at - centre) < 4) return;
    centre = at;
    const keep = new Set(wanted(from.all, at));
    for (const [i, frame] of from.images) {
      if (!keep.has(i)) {
        frame.close?.();
        from.images.delete(i);
      }
    }
    markReady(from);
    if (!from.busy && toLoad(from).length) {
      from.busy = true;
      idle(() => void loadBatch(from));
    }
  }

  /** Takes the sequence for this screen. Says whether that is another one than before. */
  function pick() {
    const shape = shapeFor(innerWidth, innerHeight, hasPortrait);
    let next = reels.get(shape);
    if (!next) {
      const sequence = journey[shape];
      const stride = strideFor(sequence, { phone: innerWidth < loading.phoneWidth, saveData });
      next = {
        sequence,
        stride,
        all: frameList(sequence, stride),
        images: new Map(),
        pending: new Set(),
        busy: false,
      };
      reels.set(shape, next);
    }
    if (next === reel) return;
    reel = next;
    shown ??= next;
    draw();
    centre = -Infinity;
    if (started && !next.busy) void loadBatch(next);
  }

  pick();
  // The first frame is the canvas' CSS background: the rest waits until the page has loaded,
  // painted and gone quiet, so decoding never competes with the first paint.
  const afterPaint = () => {
    if (signal.aborted) return;
    requestAnimationFrame(() =>
      idle(() => {
        if (signal.aborted) return;
        started = true;
        centre = frameOf(reel);
        mark(canvas, 'stride', String(reel.stride));
        if (!reel.busy) void loadBatch(reel);
      }),
    );
  };
  if (document.readyState === 'complete') afterPaint();
  else addEventListener('load', afterPaint, { once: true, signal });

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
    delete canvas.dataset.ready;
    delete canvas.dataset.stride;
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
      follow();
    },
    progress: () => position,
    end,
  };
}
