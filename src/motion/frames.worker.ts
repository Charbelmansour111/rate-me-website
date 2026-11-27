/**
 * The walk's frames, away from the page (src/motion/walk.ts). It keeps each frame's compressed bytes
 * once fetched, in memory and in the Cache API, and decodes from them: a frame the walk comes back
 * to costs a few milliseconds and no network. Messages:
 * - `decode` (id, url): the frame as a bitmap, now; its bytes fetched first if they are not here.
 * - `fetch` (urls, parallel): the files to have, in order; replaces the list before. Fetched
 *   `parallel` at a time at low priority, after any frame asked for to decode.
 * - `cache` (name): the Cache API cache to keep the bytes in; older ones of the walk go.
 * It answers `decode` with the bitmap (or nothing, if the frame failed) and reports `stored`, how
 * many files it holds, as they come in.
 */
type Message =
  | { type: 'decode'; id: number; url: string }
  | { type: 'fetch'; urls: string[]; parallel: number }
  | { type: 'cache'; name: string };
type Scope = {
  onmessage: ((event: MessageEvent<Message>) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
  caches?: CacheStorage;
};
const scope = self as unknown as Scope;

/** The files held, by address, and those on their way. */
const bytes = new Map<string, Blob>();
const coming = new Map<string, Promise<Blob>>();
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
      let blob: Blob;
      if (kept) blob = await kept.blob();
      else {
        const response = await fetch(url, { priority } as RequestInit);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        blob = await response.blob();
        // The address carries the render, so the bytes under it never change
        store?.put(url, new Response(blob, { headers: response.headers })).catch(() => {});
      }
      bytes.set(url, blob);
      scope.postMessage({ type: 'stored', count: bytes.size });
      return blob;
    })().finally(() => coming.delete(url));
    coming.set(url, pending);
  }
  return pending;
}

/** Keeps `parallel` background fetches going down the list. */
function pump() {
  while (running < parallel && queue.length) {
    const url = queue.shift()!;
    if (bytes.has(url) || coming.has(url)) continue;
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
  if (data.type === 'fetch') {
    queue = data.urls.filter((url) => !bytes.has(url));
    parallel = data.parallel;
    pump();
    return;
  }
  const { id, url } = data;
  try {
    const bitmap = await createImageBitmap(await get(url, 'high'));
    scope.postMessage({ type: 'decoded', id, bitmap }, [bitmap]);
  } catch {
    scope.postMessage({ type: 'decoded', id });
  }
};

export {};
