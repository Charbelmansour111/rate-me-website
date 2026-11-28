import { expect, test, type Page } from '@playwright/test';

import { ARABIC_ENABLED } from '../../src/config/site';

/**
 * The phone's walk is a drawing (WEBSITE 27, src/motion/pitch-walk.ts): the tactics board, driven by
 * the scroll. No photograph of the walk is ever asked for on a phone.
 */
test.skip(({ isMobile }) => !isMobile, 'a phone');

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

test('no photograph of the walk, a drawing that moves with the scroll, and no intro', async ({
  page,
}) => {
  const photos: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/journey/')) photos.push(request.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => dispatchEvent(new Event('touchstart')));
  const canvas = page.locator('[data-walk]');
  await expect(canvas).toHaveAttribute('data-vector', '');
  await expect(page.locator('html')).not.toHaveAttribute('data-walk-gate', 'open');
  // Sharp: the screen's size at its density (up to twice)
  const size = await canvas.evaluate((el: HTMLCanvasElement) => ({
    width: el.width,
    shown: el.getBoundingClientRect().width,
    dpr: devicePixelRatio,
  }));
  expect(size.width).toBe(Math.round(size.shown * Math.min(2, size.dpr)));
  const top = await picture(page);
  await page.evaluate(() => scrollTo({ top: innerHeight * 3, behavior: 'instant' }));
  await page.waitForTimeout(300);
  const lower = await picture(page);
  expect(lower).not.toBe(top);
  // Still: the same drawing (nothing runs by itself)
  await page.waitForTimeout(500);
  expect(await picture(page)).toBe(lower);
  await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(1000);
  expect(photos).toEqual([]);
});

test('the largest paint is the hero text, not the background', async ({ page }) => {
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

test('light and dark: a white ground with dark lines, a black one with light lines', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => dispatchEvent(new Event('touchstart')));
  await expect(page.locator('[data-walk]')).toHaveAttribute('data-vector', '');
  const corner = () =>
    page.locator('[data-walk]').evaluate((canvas: HTMLCanvasElement) => {
      const [r, g, b] = canvas.getContext('2d')!.getImageData(2, canvas.height - 3, 1, 1).data;
      return r + g + b;
    });
  expect(await corner()).toBeGreaterThan(700);
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));
  await page.waitForTimeout(200);
  expect(await corner()).toBeLessThan(60);
});

test('the panels change colour once a stage on a phone', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => dispatchEvent(new Event('touchstart')));
  await expect(page.locator('html')).toHaveAttribute('data-stages', 'live');
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

test('in Arabic, right to left, the same drawing', async ({ page }) => {
  test.skip(!ARABIC_ENABLED, 'Arabic is off');
  const photos: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/journey/')) photos.push(request.url());
  });
  await page.goto('/ar', { waitUntil: 'networkidle' });
  await page.evaluate(() => dispatchEvent(new Event('touchstart')));
  await expect(page.locator('[data-walk]')).toHaveAttribute('data-vector', '');
  expect(photos).toEqual([]);
});

test('reduced motion: a still drawing, and still no photograph', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const photos: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/journey/')) photos.push(request.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-walk]')).toBeHidden();
  await expect(page.locator('.walk-still').first()).toHaveCSS('background-image', /svg/);
  expect(photos).toEqual([]);
  await context.close();
});

test('no script follows the scroll for the page line on a phone: CSS does', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => dispatchEvent(new Event('touchstart')));
  await expect(page.locator('[data-walk]')).toHaveAttribute('data-vector', '');
  await page.waitForTimeout(1500);
  // The header's line: the stylesheet's scroll-driven animation (no data-motion)
  await expect(page.locator('html')).not.toHaveAttribute('data-motion');
  // The running line: the still one, every node filled
  await expect(page.locator('[data-run-line]')).not.toHaveAttribute('data-live');
  // And no smooth scrolling
  await expect(page.locator('html')).not.toHaveClass(/(^|\s)lenis(\s|$)/);
});
