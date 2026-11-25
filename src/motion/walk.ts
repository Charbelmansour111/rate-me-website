import { frameAt, frameUrl, journey, sceneAt } from '@/config/journey.config';

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
export const frameList = (saveData: boolean) =>
  Array.from({ length: journey.count }, (_, i) => i).filter((i) => !saveData || i % 2 === 0);

/** The one closest to `frame`; the earlier one when two are as close. */
export const nearest = (frames: Iterable<number>, frame: number) => {
  let best: number | undefined;
  for (const i of frames) {
    if (best === undefined || Math.abs(i - frame) < Math.abs(best - frame)) best = i;
  }
  return best;
};

/** Scrubs the image sequence with the scroll. On any failure the still pictures take over. */
export function startWalk(canvas: HTMLCanvasElement, signal: AbortSignal) {
  const root = document.documentElement;
  const page = canvas.parentElement!;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    root.dataset.journey = 'off';
    return;
  }
  const last = journey.count - 1;
  const images = new Map<number, HTMLImageElement>();
  const gapEls = [...document.querySelectorAll<HTMLElement>('[data-walk-gap]')];
  let range = 1;
  let target = 0;
  let position = 0;
  let raf = 0;

  const progress = () => Math.min(1, Math.max(0, scrollY / range));

  function draw() {
    const wanted = frameAt(position / last);
    const i = nearest(images.keys(), wanted);
    if (i === undefined) return;
    const image = images.get(i)!;
    const { width, height } = canvas;
    const part = Math.max(-0.5, Math.min(0.5, position - i)) + Math.min(0.5, position);
    const scale =
      Math.max(width / image.naturalWidth, height / image.naturalHeight) *
      (1 + STEP_ZOOM * Math.max(0, part));
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    context!.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
    canvas.dataset.frame = String(i);
    root.dataset.scene = sceneAt(position / last);
  }

  function tick() {
    position += (target - position) * EASE;
    // Close enough: land on it, and stop until the next scroll.
    if (Math.abs(target - position) < 0.004) position = target;
    draw();
    raf = position === target ? 0 : requestAnimationFrame(tick);
  }

  function onScroll() {
    target = progress() * last;
    if (!raf && target !== position) raf = requestAnimationFrame(tick);
  }

  function measure() {
    range = Math.max(1, page.offsetTop + page.offsetHeight - innerHeight);
    // Many more pixels than the pictures have would only cost time: the browser scales up for free.
    const [first] = images.values();
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

  measure();
  position = target;

  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const waiting = new Set(frameList(Boolean(connection?.saveData)));

  async function load(i: number) {
    waiting.delete(i);
    const image = new Image();
    image.decoding = 'async';
    image.src = frameUrl(i);
    try {
      await image.decode();
    } catch {
      return; // The nearest other frame stands in.
    }
    if (signal.aborted) return;
    const before = nearest(images.keys(), frameAt(position / last));
    images.set(i, image);
    if (images.size === 1) measure();
    if (nearest(images.keys(), frameAt(position / last)) !== before && !raf) draw();
  }

  async function loadBatch() {
    if (signal.aborted) return;
    const batch: Promise<void>[] = [];
    while (batch.length < BATCH && waiting.size) batch.push(load(nearest(waiting, target)!));
    await Promise.all(batch);
    if (signal.aborted) return;
    if (!images.size) root.dataset.journey = 'off';
    else if (waiting.size) idle(() => void loadBatch());
  }
  void loadBatch();

  addEventListener('scroll', onScroll, { signal, passive: true });
  addEventListener('resize', measure, { signal });
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
  });
}
