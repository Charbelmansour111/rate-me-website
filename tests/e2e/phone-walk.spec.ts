import { expect, test, type Page } from '@playwright/test';

import { ARABIC_ENABLED } from '../../src/config/site';

/**
 * A phone's walk (WEBSITE 28): its own portrait set, 540 x 960, every frame; never a landscape
 * frame. The drawing (WEBSITE 27, src/motion/pitch-walk.ts) stands in to save data, on a software
 * renderer, or when the portrait set fails (tests/e2e/motion.spec.ts).
 */
test.skip(({ isMobile }) => !isMobile, 'a phone');

/** Any landscape frame asked for: the set, its in-betweens, the intro's file. */
const landscape = (url: string) => /\/journey\/(seq|mid|pack)\//.test(url);

/** A fingerprint of what the canvas shows: a few hundred pixels, summed. */
const picture = (page: Page) =>
  page.locator('[data-walk]').evaluate((canvas: HTMLCanvasElement) => {
    const probe = document.createElement('canvas');
    probe.width = 32;
    probe.height = 64;
    const context = probe.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(canvas, 0, 0, 32, 64);
    const data = context.getImageData(0, 0, 32, 64).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += data[i] * (1 + (i % 97)) + data[i + 1];
    return sum;
  });

test('the portrait walk: its own frames, never a landscape one, no intro, moving with the scroll', async ({
  page,
}) => {
  test.slow();
  const asked: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/journey/')) asked.push(request.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  const canvas = page.locator('[data-walk]');
  await expect(canvas).toHaveAttribute('data-shape', 'portrait');
  await expect(canvas).not.toHaveAttribute('data-vector');
  await expect(page.locator('html')).not.toHaveAttribute('data-walk-gate', 'open');
  // Every frame of its set (no stride), in the background
  await page.evaluate(() => dispatchEvent(new Event('touchstart')));
  await expect(canvas).toHaveAttribute('data-stride', '1');
  await expect
    .poll(() => canvas.evaluate((el) => Number((el as HTMLElement).dataset.stored || 0)), {
      timeout: 40_000,
    })
    .toBeGreaterThanOrEqual(381);
  const top = await picture(page);
  await page.evaluate(() => scrollTo({ top: innerHeight * 3, behavior: 'instant' }));
  await page.waitForTimeout(1200);
  expect(await picture(page)).not.toBe(top);
  await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(1000);
  expect(asked.filter(landscape)).toEqual([]);
  expect(asked.some((url) => url.includes('/journey/portrait/'))).toBe(true);
});

test('the largest paint is the hero text, not the walk', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { lcp: string }).lcp = '';
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const el = (entry as PerformanceEntry & { element?: Element }).element;
        (window as unknown as { lcp: string }).lcp = el ? el.tagName : '';
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const lcp = await page.evaluate(() => (window as unknown as { lcp: string }).lcp);
  expect(lcp).not.toBe('CANVAS');
  expect(['H1', 'P', 'SPAN']).toContain(lcp);
});

test('the panels change colour once a stage on a phone', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => dispatchEvent(new Event('touchstart')));
  await expect(page.locator('html')).toHaveAttribute('data-stages', 'live', { timeout: 15_000 });
  const surface = (share: number) =>
    page.evaluate(async (s) => {
      scrollTo({
        top: (document.documentElement.scrollHeight - innerHeight) * s,
        behavior: 'instant',
      });
      await new Promise((done) => setTimeout(done, 400));
      return getComputedStyle(document.querySelector('.site-bar')!)
        .getPropertyValue('--st-surface')
        .trim();
    }, share);
  const seen = new Set<string>();
  for (let s = 0; s <= 1; s += 0.05) seen.add(await surface(s));
  // Three stages, and no blend between them
  expect(seen.size).toBe(3);
});

test('in Arabic, right to left, the same portrait walk', async ({ page }) => {
  test.skip(!ARABIC_ENABLED, 'Arabic is off');
  const asked: string[] = [];
  page.on('request', (request) => asked.push(request.url()));
  await page.goto('/ar', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-walk]')).toHaveAttribute('data-shape', 'portrait');
  expect(asked.filter(landscape)).toEqual([]);
});

test('to save data, the drawing: light and dark, and no photograph at all', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'connection', { value: { saveData: true } }),
  );
  const asked: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/journey/')) asked.push(request.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => dispatchEvent(new Event('touchstart')));
  const canvas = page.locator('[data-walk]');
  await expect(canvas).toHaveAttribute('data-vector', '', { timeout: 15_000 });
  const corner = () =>
    canvas.evaluate((el: HTMLCanvasElement) => {
      const [r, g, b] = el.getContext('2d')!.getImageData(2, el.height - 3, 1, 1).data;
      return r + g + b;
    });
  expect(await corner()).toBeGreaterThan(700);
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
  await page.waitForTimeout(200);
  expect(await corner()).toBeLessThan(60);
  // The preloaded first frame is the only one a saving phone may have asked for
  expect(asked.filter((url) => !/portrait\/f000/.test(url))).toEqual([]);
});

test('reduced motion: a still drawing, and no photograph of the walk', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const asked: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/journey/')) asked.push(request.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-walk]')).toBeHidden();
  await expect(page.locator('.walk-still').first()).toHaveCSS('background-image', /svg/);
  expect(asked.filter(landscape)).toEqual([]);
  await context.close();
});

test('no script follows the scroll for the page line on a phone: CSS does', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => dispatchEvent(new Event('touchstart')));
  await expect(page.locator('html')).toHaveAttribute('data-stages', 'live', { timeout: 15_000 });
  await page.waitForTimeout(1000);
  await expect(page.locator('html')).not.toHaveAttribute('data-motion');
  await expect(page.locator('[data-run-line]')).not.toHaveAttribute('data-live');
  await expect(page.locator('html')).not.toHaveClass(/(^|\s)lenis(\s|$)/);
});
