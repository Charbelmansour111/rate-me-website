import {
  frameAt,
  frameUrl,
  journey,
  loading,
  pairWindow,
  sceneAt,
  type Sequence,
  type Shape,
} from '@/config/journey.config';

import {
  betweenList,
  blend,
  covered,
  frameList,
  nearest,
  outward,
  strideFor,
  wanted,
} from './walk-frames';

export { blend, covered, frameList, nearest, strideFor, wanted };

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
 * Fetches, keeps and decodes frames in a worker (src/motion/frames.worker.ts): the page only
 * receives whole bitmaps. Without workers or createImageBitmap, or if the worker cannot start, the
 * frames are decoded here instead, and nothing is fetched ahead.
 */
function frameDecoder(onStored: (count: number) => void) {
  const waiting = new Map<
    number,
    { url: string; resolve: (frame: Frame) => void; reject: () => void }
  >();
  let worker: Worker | undefined;
  let next = 0;
  try {
    if ('createImageBitmap' in window && 'Worker' in window) {
      worker = new Worker(new URL('./frames.worker.ts', import.meta.url), { type: 'module' });
      worker.postMessage({ type: 'cache', name: loading.cache });
    }
  } catch {
    worker = undefined;
  }
  worker?.addEventListener(
    'message',
    ({
      data,
    }: MessageEvent<
      { type: 'decoded'; id: number; bitmap?: ImageBitmap } | { type: 'stored'; count: number }
    >) => {
      if (data.type === 'stored') return onStored(data.count);
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
        worker!.postMessage({ type: 'decode', id, url });
      });
    },
    /** The files to have, in order, fetched in the background. */
    fetch(urls: string[], parallel: number) {
      worker?.postMessage({ type: 'fetch', urls, parallel });
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
 * A sequence: the frames it can show at its stride (with the in-between ones, tier 2, where they
 * are used), those decoded and those on their way.
 */
type Reel = {
  sequence: Sequence;
  stride: number;
  all: number[];
  /** The frames themselves (tier 1), and the in-between ones (tier 2), for the background. */
  tiers: number[][];
  images: Map<number, Frame>;
  pending: Set<number>;
  /** Frames that failed: not asked for again; their neighbours stand in. */
  broken: Set<number>;
};

/** The walk, for the scroll to drive: src/motion/rich.ts ties it to ScrollTrigger and Lenis. */
export type Walk = {
  /**
   * Shows the walk at `progress` (0 to 1). `resting`: it has stopped there, so it shows the nearest
   * frame alone rather than two blended.
   */
  seek(progress: number, resting?: boolean): void;
  /** Where it is now, 0 to 1. */
  progress(): number;
  /** One frame of the set on show, in progress (0 to 1): the most the walk moves in a frame. */
  step(): number;
  /**
   * Whether the picture can be at `progress` without jumping across a gap: a decoded frame lies
   * within `reach` (in progress) of it.
   */
  covers(progress: number, reach: number): boolean;
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
  // The frames are drawn at their own size (CSS scales the canvas on the compositor): the best
  // filter, should a frame ever be drawn scaled (a turn to a set of another size)
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  const saveData = Boolean(connection?.saveData);
  /** Below 4G: the thinned set, as on a phone. */
  const slow = ['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? '');
  /** Nothing is fetched until the page has loaded and painted (see `afterPaint` below). */
  let started = false;
  /** The frame the kept window was last centred on, which way and how fast the walk was going. */
  let centre = -Infinity;
  let direction = 0;
  let speed = 0;
  let last = NaN;
  /** Where the background list was last ordered from. */
  let fetchedFrom = -Infinity;
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
  let resting = true;
  const decoder = frameDecoder((count) => (canvas.dataset.stored = String(count)));

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
   * The two frames around the position, the next one fading in by how far along it is, over a
   * window that narrows the more the picture moves between them (src/config/journey.config.ts,
   * `pairWindow`). At rest, the nearest alone. Nothing is drawn when the picture would be the same,
   * and one frame alone is one draw.
   */
  function draw() {
    if (reel.images.size) shown = reel;
    const { sequence, images } = shown;
    const mix = blend(
      images.keys(),
      position * (sequence.count - 1),
      resting ? 0 : (from, to) => pairWindow(sequence, from, to),
      shown.stride,
    );
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
  const want = (from: Reel) => wanted(from.all, frameOf(from), direction, speed);

  /** Says, for the tests, whether every frame around the walk's position is in. */
  function markReady(from: Reel) {
    const list = want(from);
    const missing = list.some((i) => !from.images.has(i) && !from.broken.has(i));
    mark(canvas, 'ready', missing ? 'false' : 'true');
    canvas.dataset.loaded = String(from.images.size);
    canvas.dataset.wanted = String(list.length);
  }

  /**
   * The frames still to decode around the position: the nearest first, the anchors after. Moving
   * fast, nearest to where the walk will be when they arrive, a few screen frames on.
   */
  function toLoad(from: Reel) {
    const at = frameOf(from) + (speed > from.stride ? direction * speed * 4 : 0);
    const close = (i: number) => Math.abs(i - at) <= loading.window;
    return want(from)
      .filter((i) => !from.images.has(i) && !from.pending.has(i) && !from.broken.has(i))
      .sort((a, b) => Number(close(b)) - Number(close(a)) || Math.abs(a - at) - Math.abs(b - at));
  }

  async function load(from: Reel, i: number) {
    from.pending.add(i);
    let frame: Frame | undefined;
    try {
      frame = await decoder.decode(frameUrl(from.sequence, i));
    } catch {
      // The frames either side stand in.
    } finally {
      from.pending.delete(i);
    }
    if (!frame) {
      from.broken.add(i);
      return failed(from);
    }
    if (signal.aborted) return frame.close?.();
    // Left behind while it was on its way: not needed now
    if (!want(from).includes(i)) frame.close?.();
    else {
      from.images.set(i, frame);
      // Drawn only if it is one of the two on show, or the first: the rest wait for the scroll.
      if (from === reel && (from.images.size === 1 || Math.abs(i - frameOf(from)) <= from.stride)) {
        draw();
      }
    }
    if (from === reel) markReady(from);
    pump(from);
  }

  /** No frame of a set came in: the portrait set gives way to the landscape one, which to stills. */
  function failed(from: Reel) {
    if (from.images.size || from.pending.size || toLoad(from).length) return pump(from);
    if (from.sequence !== journey.portrait) {
      root.dataset.journey = 'off';
      return;
    }
    hasPortrait = false;
    pick();
  }

  /** Keeps `loading.decoders` frames decoding, the nearest first. */
  function pump(from: Reel) {
    if (!started || signal.aborted || from !== reel) return;
    for (const i of toLoad(from).slice(0, Math.max(0, loading.decoders - from.pending.size))) {
      void load(from, i);
    }
  }

  /**
   * The files of the set to fetch in the background, from where the walk is outward: the frames
   * themselves first, the in-between ones after. Not when saving data: only what the walk shows.
   */
  function fetchAll(from: Reel) {
    if (!started || saveData) return;
    const at = frameOf(from);
    fetchedFrom = at;
    const urls = from.tiers.flatMap((tier) =>
      outward(tier, at).map((i) => frameUrl(from.sequence, i)),
    );
    decoder.fetch(urls, innerWidth < loading.phoneWidth ? loading.phoneFetchers : loading.fetchers);
  }

  /**
   * Keeps the window round the position: lets go of the frames it has left (their bitmaps
   * closed) and decodes those it has come to. Run as the walk moves, every few frames.
   */
  function follow() {
    if (!started) return;
    const from = reel;
    const at = frameOf(from);
    if (Math.abs(at - centre) < 4) return;
    // Which way it goes: the next frames are decoded in front of it
    direction = centre === -Infinity ? 0 : Math.sign(at - centre);
    centre = at;
    const keep = new Set(want(from));
    for (const [i, frame] of from.images) {
      if (!keep.has(i)) {
        frame.close?.();
        from.images.delete(i);
      }
    }
    markReady(from);
    pump(from);
    // Far from where the background list was ordered: from here outward now
    if (Math.abs(at - fetchedFrom) > 32) fetchAll(from);
  }

  /** Takes the sequence for this screen. */
  function pick() {
    const shape = shapeFor(innerWidth, innerHeight, hasPortrait);
    let next = reels.get(shape);
    if (!next) {
      const sequence = journey[shape];
      const phone = innerWidth < loading.phoneWidth;
      const stride = strideFor(sequence, { phone, saveData, slow });
      const frames = frameList(sequence, stride);
      // In-between frames only where every frame is used: a wide screen on a good connection
      const between = stride === 1 && !phone ? betweenList(sequence) : [];
      next = {
        sequence,
        stride,
        all: [...frames, ...between].sort((a, b) => a - b),
        tiers: [frames, between],
        images: new Map(),
        pending: new Set(),
        broken: new Set(),
      };
      reels.set(shape, next);
    }
    if (next === reel) return;
    reel = next;
    shown ??= next;
    draw();
    centre = -Infinity;
    if (started) {
      mark(canvas, 'stride', String(next.stride));
      pump(next);
      fetchAll(next);
    }
  }

  pick();
  // The first frame is the canvas' CSS background: the rest waits until the page has loaded,
  // painted and gone quiet, so fetching and decoding never compete with the first paint.
  const afterPaint = () => {
    if (signal.aborted) return;
    requestAnimationFrame(() =>
      idle(() => {
        if (signal.aborted) return;
        started = true;
        centre = frameOf(reel);
        mark(canvas, 'stride', String(reel.stride));
        markReady(reel);
        pump(reel);
        // The rest of the set once the visitor is under way (or a while on), when it is quiet, so
        // it never competes with the page settling
        let begun = false;
        const begin = () => {
          if (begun || signal.aborted) return;
          begun = true;
          idle(() => fetchAll(reel));
        };
        for (const type of ['scroll', 'pointerdown', 'keydown', 'wheel', 'touchstart']) {
          addEventListener(type, begin, { once: true, passive: true, signal });
        }
        setTimeout(begin, loading.backgroundAfter);
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
    for (const key of ['loaded', 'ready', 'stride', 'stored', 'wanted', 'frame', 'blend', 'at']) {
      delete canvas.dataset[key];
    }
    delete canvas.dataset.shape;
    gaps.disconnect();
    delete root.dataset.journey;
    delete root.dataset.scene;
    for (const { images } of reels.values()) for (const frame of images.values()) frame.close?.();
  });

  return {
    seek(progress, rest = false) {
      // How fast it goes, in frames of the set per screen frame, smoothed over a few
      const frames = progress * (reel.sequence.count - 1);
      if (!Number.isNaN(last)) speed = speed * 0.6 + Math.abs(frames - last) * 0.4;
      last = frames;
      position = progress;
      resting = rest;
      draw();
      follow();
    },
    progress: () => position,
    step: () => shown.stride / Math.max(1, shown.sequence.count - 1),
    covers(progress, reach) {
      // Nothing decoded yet: the first frame (the canvas' CSS background) stands
      if (!shown.images.size) return true;
      const count = shown.sequence.count - 1;
      return covered(shown.images.keys(), progress * count, reach * count);
    },
    end,
  };
}
