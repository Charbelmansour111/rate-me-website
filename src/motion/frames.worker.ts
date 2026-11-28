/**
 * The walk's frames, away from the page (src/motion/walk.ts). It keeps each frame's compressed bytes
 * once fetched, in memory and in the Cache API, and decodes from them: a frame the walk comes back
 * to costs a few milliseconds and no network. Messages:
 * - `decode` (id, url, width?): the frame as a bitmap, now, at `width` px wide if given (the
 *   thumbnail track, WEBSITE 26); its bytes fetched first if they are not here.
 * - `pause` (on): while the page scrolls only the list's `near` frames (sent with `fetch`, those
 *   round where the page is) are fetched, two at a time; the rest wait (WEBSITE 29).
 * - `fetch` (urls, parallel): the files to have, in order; replaces the list before. Fetched
 *   `parallel` at a time at low priority, after any frame asked for to decode.
 * - `cache` (name): the Cache API cache to keep the bytes in; older ones of the walk go.
 * - `expect` (urls): frames the page fetches itself (the intro's file, WEBSITE 25): not fetched
 *   here, and asked for they wait on it. `put` (url, blob) hands one over, kept as if fetched here;
 *   `drop` (urls) gives up on those not in, fetched here first instead.
 * It answers `decode` with the bitmap (or nothing, if the frame failed) and reports `stored`: how
 * many files it holds and which came in since, every 16 files, 100 ms after a file at the latest,
 * and when the list is done.
 */
type Message =
  | { type: 'decode'; id: number; url: string; width?: number }
  | { type: 'pause'; on: boolean }
  | { type: 'fetch'; urls: string[]; parallel: number; near?: string[] }
  | { type: 'near'; urls: string[] }
  | { type: 'cache'; name: string }
  | { type: 'expect'; urls: string[] }
  | { type: 'put'; url: string; blob: Blob }
  | { type: 'drop'; urls: string[] };
type Scope = {
  onmessage: ((event: MessageEvent<Message>) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
  caches?: CacheStorage;
};
const scope = self as unknown as Scope;

/** The files held, by address, and those on their way. */
const bytes = new Map<string, Blob>();
const coming = new Map<string, Promise<Blob>>();
/** Files come in since the page was last told, and the timer that will tell it. */
let fresh: string[] = [];
let flush: ReturnType<typeof setTimeout> | 0 = 0;

function tell() {
  clearTimeout(flush);
  flush = 0;
  if (!fresh.length) return;
  scope.postMessage({ type: 'stored', count: bytes.size, urls: fresh });
  fresh = [];
}
let cache: Promise<Cache | undefined> = Promise.resolve(undefined);
/** The background list, and how many of its fetches are running. */
let queue: string[] = [];
let parallel = 0;
let running = 0;

function openCache(name: string) {
  const store = scope.caches;
  if (!store) return Promise.resolve(undefined);
  return (async () => {
    try {
      // The walk's earlier caches (another render, another version of this code) are let go
      for (const key of await store.keys()) {
        if (key.startsWith('walk-') && key !== name) await store.delete(key);
      }
      return await store.open(name);
    } catch {
      return undefined; // A private window, a full disk: memory alone
    }
  })();
}

/** A file's bytes: held, in the cache, or fetched (at low priority for the background). */
function get(url: string, priority: 'high' | 'low'): Promise<Blob> {
  const held = bytes.get(url);
  if (held) return Promise.resolve(held);
  let pending = coming.get(url);
  if (!pending) {
    pending = (async () => {
      const store = await cache;
      const kept = await store?.match(url).catch(() => undefined);
      if (kept) return keep(url, await kept.blob());
      const response = await fetch(url, { priority } as RequestInit);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      // The address carries the render, so the bytes under it never change. Only a whole file is
      // kept (a cut connection rejects blob(); a short body is checked against its length), so a
      // later visit never decodes part of a frame (WEBSITE 29)
      const length = Number(response.headers.get('content-length') ?? blob.size);
      if (blob.size && (!length || length === blob.size)) {
        store?.put(url, new Response(blob, { headers: response.headers })).catch(() => {});
      }
      return keep(url, blob);
    })().finally(() => coming.delete(url));
    coming.set(url, pending);
  }
  return pending;
}

/** Holds a file's bytes, and tells the page now and then. */
function keep(url: string, blob: Blob) {
  bytes.set(url, blob);
  // Not for every file (each message is a task on the page): 16 at a time, within 100 ms of the
  // first one waiting, or at the end of the list
  fresh.push(url);
  if (fresh.length >= 16 || !queue.length) tell();
  else flush ||= setTimeout(tell, 100);
  return blob;
}

/** Frames another fetch brings (the page's, of the intro's file): asked for, they wait on it. */
const expected = new Map<
  string,
  { resolve: (blob: Blob) => void; reject: (error: unknown) => void }
>();

function expect(urls: string[]) {
  for (const url of urls) {
    if (bytes.has(url) || coming.has(url)) continue;
    const pending = new Promise<Blob>((resolve, reject) => expected.set(url, { resolve, reject }));
    pending.catch(() => {}).finally(() => coming.delete(url));
    coming.set(url, pending);
  }
}

/** Keeps `parallel` background fetches going down the list. */
/**
 * While the page scrolls (WEBSITE 29): the frames near where it is still come, MOVING at a time;
 * only the far ones wait. (A full pause starved a visitor who kept scrolling: the walk stayed thin.)
 */
let paused = false;
/** The frames near the walk, nearest first: all that is fetched while the page moves. */
let near: string[] = [];
const MOVING = 4;

function pump() {
  while (queue.length) {
    if (running >= (paused ? MOVING : parallel)) return;
    let url: string;
    if (paused) {
      const next = near.find((one) => !bytes.has(one) && !coming.has(one));
      if (next === undefined) return;
      url = next;
      const at = queue.indexOf(next);
      if (at >= 0) queue.splice(at, 1);
    } else {
      url = queue.shift()!;
      if (bytes.has(url) || coming.has(url)) continue;
    }
    running++;
    get(url, 'low')
      .catch(() => {}) // A frame that fails is skipped: its neighbours stand in
      .finally(() => {
        running--;
        pump();
      });
  }
}

scope.onmessage = async ({ data }) => {
  if (data.type === 'cache') {
    cache = openCache(data.name);
    return;
  }
  if (data.type === 'expect') return expect(data.urls);
  if (data.type === 'put') {
    const wait = expected.get(data.url);
    expected.delete(data.url);
    if (bytes.has(data.url)) return;
    keep(data.url, data.blob);
    const headers = { 'Content-Type': data.blob.type || 'image/webp' };
    void cache.then((store) => store?.put(data.url, new Response(data.blob, { headers })));
    wait?.resolve(data.blob);
    return;
  }
  if (data.type === 'drop') {
    const left = data.urls.filter((url) => !bytes.has(url));
    for (const url of left) {
      expected.get(url)?.reject(new Error('dropped'));
      expected.delete(url);
      coming.delete(url);
    }
    queue = [...left, ...queue];
    pump();
    return;
  }
  if (data.type === 'fetch') {
    queue = data.urls.filter((url) => !bytes.has(url));
    near = data.near ?? [];
    parallel = data.parallel;
    pump();
    return;
  }
  // While the page moves (WEBSITE 29): only the frames near it, a short list, not the whole order
  if (data.type === 'near') {
    near = data.urls;
    pump();
    return;
  }
  if (data.type === 'pause') {
    paused = data.on;
    if (!paused) pump();
    return;
  }
  const { id, url, width } = data;
  try {
    const blob = await get(url, 'high');
    const bitmap = await (width
      ? createImageBitmap(blob, {
          resizeWidth: width,
          resizeHeight: Math.round((width * 9) / 16),
          resizeQuality: 'medium',
        })
      : createImageBitmap(blob));
    scope.postMessage({ type: 'decoded', id, bitmap }, [bitmap]);
  } catch {
    scope.postMessage({ type: 'decoded', id });
  }
};

export {};
