import {
  frameAt,
  frameUrl,
  heldKey,
  journey,
  loading,
  pairWindow,
  sceneAt,
  type Sequence,
  type Shape,
} from '@/config/journey.config';
import { edgeBottom, edgeTop } from '@/config/walk-edges';
import { introPack } from '@/config/walk-pack';

import {
  apart,
  blend,
  bracket,
  frameList,
  merge,
  nearest,
  outward,
  spacingOf,
  strideFor,
  tierTwo,
  wanted,
} from './walk-frames';

export { blend, frameList, nearest, strideFor, wanted };

/** Notes that this visit held a set whole: the next has no intro (journey.config.ts, heldKey). */
function remember({ sequence, stride }: { sequence: Sequence; stride: number }) {
  try {
    localStorage.setItem(heldKey(sequence, stride), '1');
  } catch {
    // Private windows, storage off: the gate shows again next time
  }
}

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
function frameDecoder(onStored: (count: number, urls: string[]) => void, signal: AbortSignal) {
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
      | { type: 'decoded'; id: number; bitmap?: ImageBitmap }
      | { type: 'stored'; count: number; urls: string[] }
    >) => {
      if (data.type === 'stored') return onStored(data.count, data.urls);
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
    /**
     * Several frames in one file (src/config/walk-pack.ts), fetched here, where it can start before
     * the worker's own code is in: each frame goes to the worker as its bytes come in, kept under
     * its own address. Not when most of them are in the cache already.
     */
    async pack(url: string, files: { url: string; size: number }[]) {
      if (!worker) return;
      const urls = files.map((file) => file.url);
      worker.postMessage({ type: 'expect', urls });
      let next = 0;
      try {
        const store = await caches.open(loading.cache);
        const kept = await Promise.all(urls.map((one) => store.match(one)));
        if (kept.filter(Boolean).length > urls.length / 2) throw new Error('held');
      } catch (error) {
        if ((error as Error).message === 'held') return worker?.postMessage({ type: 'drop', urls });
      }
      try {
        const response = await fetch(url, { priority: 'high' } as RequestInit);
        if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
        const reader = response.body.getReader() as ReadableStreamDefaultReader<
          Uint8Array<ArrayBuffer>
        >;
        let parts: BlobPart[] = [];
        let partsFrom = 0;
        let received = 0;
        let start = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (value) {
            parts.push(value);
            received += value.length;
          }
          // Every frame whose bytes are all in
          while (next < files.length && start + files[next].size <= received) {
            const { url: frame, size } = files[next];
            const all = new Blob(parts);
            const blob = all.slice(start - partsFrom, start - partsFrom + size, 'image/webp');
            start += size;
            next++;
            worker?.postMessage({ type: 'put', url: frame, blob });
            // What is left of the file from here on
            parts = [all.slice(start - partsFrom)];
            partsFrom = start;
          }
          if (done || signal.aborted) break;
        }
        if (next < files.length && !signal.aborted) throw new Error('short');
      } catch {
        worker?.postMessage({ type: 'drop', urls: urls.slice(next) });
      }
    },
    stop() {
      worker?.terminate();
      waiting.clear();
    },
    /** Whether files are fetched ahead (a worker runs). */
    get fetches() {
      return Boolean(worker);
    },
  };
}

/** Which sequence a screen gets. */
export const shapeFor = (width: number, height: number, hasPortrait: boolean): Shape =>
  hasPortrait && height > width ? 'portrait' : 'landscape';

/**
 * A sequence: the frames it can show (its set at its stride, and those of tier 2 already held;
 * while a first visit's set is still coming, only the frames held), those decoded and those on
 * their way.
 */
type Reel = {
  sequence: Sequence;
  stride: number;
  all: number[];
  /** The set at its stride (tier 1) and tier 2 (src/motion/walk-frames.ts, tierTwo). */
  tier1: number[];
  tier2: number[];
  /** The frames of each tier the worker holds. */
  held1: Set<number>;
  held2: Set<number>;
  /** Tier 2 asked for (once the set is held). */
  askedTwo: boolean;
  byUrl: Map<string, { tier: 1 | 2; at: number }>;
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
  /** One frame of the set's 381 (whatever is in use), in progress (0 to 1). */
  frame(): number;
  /**
   * One step of the list in use, in progress: an in-between frame once tier 2 is in, else a frame
   * of the set at its stride. The walk moves a few of these a screen frame at most.
   */
  step(): number;
  /**
   * How far from `from` toward `to` (progress) the picture can go on decoded frames alone: `to` if
   * the frames either side of it are decoded, else the furthest decoded frame of the list on the
   * way, else `from` (it waits).
   */
  reach(from: number, to: number): number;
  /**
   * Of the intro's frames (every `loading.introEvery`-th of the set and those round the walk), how
   * many the worker holds; whether the frames round the walk are decoded.
   */
  held(): { held: number; total: number; ready: boolean };
  /**
   * The first visit (src/motion/walk-gate.ts): the intro's frames are fetched now, first, then the
   * rest of the set and tier 2; until the set is whole the walk shows only the frames held, so it
   * never waits on the network.
   */
  fetchNow(): void;
  /** Whether this browser held the whole set on an earlier visit (in its Cache API). */
  known(): boolean;
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
  /**
   * Tier 2 only on 4G or better, never to save data. A browser that does not say (Safari, Firefox)
   * is taken to be on a good connection: it gets tier 2 after the whole set, as Chrome on 4G does.
   */
  const good = !saveData && (connection?.effectiveType ?? '4g') === '4g';
  /** Until the first window round the walk is in, it is decoded a few at a time when quiet. */
  let warmed = false;
  let quiet = false;
  /** Nothing is fetched until the page has loaded and painted (see `afterPaint` below). */
  let started = false;
  /** A first visit's set still coming: the walk shows the frames held (see `listOf`). */
  let filling = false;
  /** The intro's frames all held: the rest of the set is fetched. */
  let introIn = false;
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
  /**
   * Where the walk ends, in px of scroll. Read every frame (the scroll's speed limit, src/motion/
   * smooth.ts), so measured only when the page or the window changes size: a read of offsetTop
   * after any change forces the browser to lay the page out there and then (WEBSITE 25).
   */
  let endAt = 1;
  const measureEnd = () => {
    endAt = Math.max(1, page.offsetTop + page.offsetHeight - innerHeight);
  };
  measureEnd();
  const end = () => endAt;
  const sized = new ResizeObserver(measureEnd);
  sized.observe(page);
  /** Along the walk, 0 to 1: until the scroll drives it, where the page was opened. */
  let position = Math.min(1, Math.max(0, scrollY / end()));
  let resting = true;
  const decoder = frameDecoder(stored, signal);

  /**
   * Files the worker has come to hold: tier 2 frames join the walk as they arrive, and once the
   * whole set is held, tier 2 is asked for.
   */
  function stored(count: number, urls: string[]) {
    canvas.dataset.stored = String(count);
    for (const one of reels.values()) {
      let grew = false;
      for (const url of urls) {
        const found = one.byUrl.get(url);
        if (!found) continue;
        const held = found.tier === 1 ? one.held1 : one.held2;
        if (held.has(found.at)) continue;
        held.add(found.at);
        // A frame of the set only changes the list while the list is the frames held
        if (found.tier === 2 || filling) grew = true;
      }
      const whole = one.held1.size === one.tier1.length;
      if (grew) {
        one.all = listOf(one);
        // New frames round the walk: decode them (the walk may be waiting on one)
        if (one === reel) {
          markReady(one);
          pump(one);
        }
      }
      if (one === reel) {
        canvas.dataset.dense = String(one.held2.size);
        // The intro's frames are in: now the rest of the set
        if (filling && !introIn && introSet(one).every((i) => one.held1.has(i))) {
          introIn = true;
          fetchAll(one);
        }
        // Held whole: a later visit finds it in the Cache API and has no intro
        if (whole) remember(one);
        // The set is held: now tier 2, from where the walk is
        if (one.tier2.length && whole && !one.askedTwo) {
          one.askedTwo = true;
          fetchAll(one);
        }
      }
    }
  }

  /**
   * The frames a reel can show: its set and the tier 2 frames held; on a first visit, until the set
   * is whole, only the frames of it held, so the walk moves on what is here (thinner where the rest
   * has not come yet) and never waits on the network.
   */
  function listOf(one: Reel) {
    const two = [...one.held2].sort((a, b) => a - b);
    if (!filling || one.held1.size === one.tier1.length) return merge(one.tier1, two);
    return merge(
      [...one.held1].sort((a, b) => a - b),
      two,
    );
  }

  /** The intro's frames: every `loading.introEvery`-th of the set, and those round the walk. */
  function introSet(one: Reel) {
    const at = frameOf(one);
    const last = one.tier1[one.tier1.length - 1];
    return one.tier1.filter(
      (i) => i % loading.introEvery === 0 || i === last || Math.abs(i - at) <= loading.introWindow,
    );
  }

  /** What is on the canvas: the set, its two frames and the fade in 255ths (the finest shown). */
  let drawn = '';
  /** The window's ground on a phone, and the frame whose edges it shows. */
  const ground = document.querySelector<HTMLElement>('[data-walk-ground]');
  const windowed = matchMedia('(max-width: 47.99rem)');
  let grounded = -1;
  /** The whole frame mostly on show. */
  const mainFrame = ({ from, to, alpha }: { from: number; to: number; alpha: number }) =>
    Math.round(alpha >= 0.5 ? to : from);

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
    const at = position * (sequence.count - 1);
    let mix = blend(images.keys(), at, resting ? 0 : (from, to) => pairWindow(sequence, from, to));
    if (!mix) return;
    // Never across a frame of the set between the two, decoded or not: the nearest alone
    if (mix.from !== mix.to && apart(shown.all, mix.from, mix.to)) {
      const only = at - mix.from <= mix.to - at ? mix.from : mix.to;
      mix = { from: only, to: only, alpha: 0 };
    }
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
    // On a phone the window's ground takes the colour of the frame's edges, set on it alone (a
    // property on <html> would restyle the page)
    if (ground && windowed.matches && sequence === journey.landscape) {
      const i = mainFrame(mix);
      if (i !== grounded) {
        grounded = i;
        ground.style.setProperty('--edge-top', edgeTop[i] ?? '');
        ground.style.setProperty('--edge-bottom', edgeBottom[i] ?? '');
      }
    }
    // Where the walk is, in frames; the frame mostly on show, the set, and the part of the walk.
    canvas.dataset.at = (position * (sequence.count - 1)).toFixed(3);
    mark(canvas, 'frame', String(nearest(images.keys(), frameAt(sequence, position))));
    mark(canvas, 'shape', sequence === journey.portrait ? 'portrait' : 'landscape');
    mark(root, 'scene', sceneAt(position));
  }

  /** Where the walk is on a reel, in frames. */
  const frameOf = (from: Reel) => position * (from.sequence.count - 1);
  /** Narrower where tier 2 makes the frames denser than the set's stride: as many stay decoded. */
  const want = (from: Reel) =>
    wanted(
      from.all,
      frameOf(from),
      direction,
      speed,
      Math.min(1, spacingOf(from.all) / from.stride),
    );

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

  /**
   * Keeps `loading.decoders` frames decoding, the nearest first. Until the first window is in (and
   * the walk has not moved), `loading.firstDecoders` at a time, each batch in a quiet moment, so the
   * page's own first work never waits behind them (WEBSITE 23: Lighthouse).
   */
  function pump(from: Reel) {
    if (!started || signal.aborted || from !== reel) return;
    if (!warmed && canvas.dataset.ready === 'true' && from.images.size) warmed = true;
    if (!warmed) {
      if (quiet) return;
      quiet = true;
      idle(() => {
        quiet = false;
        if (signal.aborted || from !== reel) return;
        const room = Math.max(0, loading.firstDecoders - from.pending.size);
        for (const i of toLoad(from).slice(0, room)) void load(from, i);
      });
      return;
    }
    for (const i of toLoad(from).slice(0, Math.max(0, loading.decoders - from.pending.size))) {
      void load(from, i);
    }
  }

  /**
   * The files of the set to fetch in the background, from where the walk is outward; once they are
   * all held, tier 2 the same way, on a good connection. Not when saving data: only what the walk
   * shows.
   */
  function fetchAll(from: Reel) {
    if (!started || saveData) return;
    const at = frameOf(from);
    fetchedFrom = at;
    const whole = from.held1.size === from.tier1.length;
    // A first visit: the intro's frames alone, those round the walk first, so nothing else takes
    // the connection from them; the rest once they are in (see `stored`)
    const intro = filling && !whole && !introIn ? outward(introSet(from), at) : [];
    const urls = (
      intro.length
        ? intro
        : [...outward(from.tier1, at), ...(whole && good ? outward(from.tier2, at) : [])]
    ).map((i) => frameUrl(from.sequence, i));
    // The intro waits on these: as many at once as the browser allows one server (HTTP/1.1)
    const parallel = intro.length
      ? loading.introFetchers
      : innerWidth < loading.phoneWidth
        ? loading.phoneFetchers
        : loading.fetchers;
    decoder.fetch(urls, parallel);
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
    // Under way: decoding at full pace from now
    if (centre !== -Infinity) warmed = true;
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
      const tier1 = frameList(sequence, stride);
      // Tier 2 on a good connection, and on a phone only where the phone thinned the set
      const tier2 =
        good && (phone ? stride === loading.phoneStride : stride === 1)
          ? tierTwo(sequence, stride, phone)
          : [];
      const byUrl = new Map<string, { tier: 1 | 2; at: number }>();
      for (const at of tier1) byUrl.set(frameUrl(sequence, at), { tier: 1, at });
      for (const at of tier2) byUrl.set(frameUrl(sequence, at), { tier: 2, at });
      next = {
        sequence,
        stride,
        all: tier1,
        tier1,
        tier2,
        held1: new Set(),
        held2: new Set(),
        askedTwo: false,
        byUrl,
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

  /** The rest of the set: at the first sign of use, a while after load, or now (the gate). */
  let begun = false;
  let eager = false;
  function begin() {
    if (begun || !started || signal.aborted) return;
    begun = true;
    idle(() => fetchAll(reel));
  }
  function fetchNow() {
    eager = true;
    // Saving data, or with no worker, nothing is fetched ahead: the set stays the list
    if (!saveData && decoder.fetches) {
      filling = true;
      for (const one of reels.values()) one.all = listOf(one);
      // The intro's thin set as one file, at once: the intro is up, nothing else is waiting
      const { sequence } = reel;
      if (sequence === journey.landscape && introPack.every === loading.introEvery) {
        void decoder.pack(
          `${introPack.path}?v=${sequence.rev}`,
          introPack.frames.map((i, n) => ({
            url: frameUrl(sequence, i),
            size: introPack.sizes[n],
          })),
        );
      }
    }
    begin();
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
        if (eager) begin();
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
    measureEnd();
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
    for (const key of [
      'loaded',
      'ready',
      'stride',
      'stored',
      'dense',
      'wanted',
      'frame',
      'blend',
      'at',
    ]) {
      delete canvas.dataset[key];
    }
    delete canvas.dataset.shape;
    gaps.disconnect();
    sized.disconnect();
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
    frame: () => 1 / Math.max(1, shown.sequence.count - 1),
    step: () => spacingOf(shown.all) / Math.max(1, shown.sequence.count - 1),
    reach(from, to) {
      // Nothing decoded yet: the first frame (the canvas' CSS background) stands
      if (!shown.images.size) return to;
      const count = Math.max(1, shown.sequence.count - 1);
      const ok = (i: number | undefined) =>
        i === undefined || shown.images.has(i) || shown.broken.has(i);
      const [lo, hi] = bracket(shown.all, to * count);
      if (ok(lo) && ok(hi)) return to;
      // The frames it waits on: asked for now, ahead of anything else
      for (const i of [lo, hi]) {
        if (i !== undefined && !ok(i) && !shown.pending.has(i) && shown === reel) {
          void load(shown, i);
        }
      }
      // The furthest frame of the list between the two that is decoded
      const a = from * count;
      const b = to * count;
      const way = shown.all.filter((i) => (b > a ? i > a && i < b : i < a && i > b));
      if (b > a) way.reverse();
      const stop = way.find((i) => shown.images.has(i));
      return stop === undefined ? from : stop / count;
    },
    known: () => {
      try {
        return localStorage.getItem(heldKey(reel.sequence, reel.stride)) === '1';
      } catch {
        return false;
      }
    },
    held: () => {
      const set = introSet(reel);
      return {
        held: set.filter((i) => reel.held1.has(i)).length,
        total: set.length,
        ready: canvas.dataset.ready === 'true' && reel.images.size > 0,
      };
    },
    fetchNow,
    end,
  };
}
