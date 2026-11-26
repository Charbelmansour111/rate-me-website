/**
 * Fetches and decodes the walk's frames away from the page (src/motion/walk.ts), and hands back
 * finished bitmaps: nothing of a frame touches the main thread until it can be drawn.
 */
type Job = { id: number; url: string };
type Scope = {
  onmessage: ((event: MessageEvent<Job>) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
};
const scope = self as unknown as Scope;

scope.onmessage = async ({ data: { id, url } }) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob());
    scope.postMessage({ id, bitmap }, [bitmap]);
  } catch {
    scope.postMessage({ id });
  }
};

export {};
