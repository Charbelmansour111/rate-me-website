import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { fadeWindow, frameAt, journey } from '../../src/config/journey.config';
import { ROLE_SHAPES } from '../../src/motion/tactics-data';
import { ARABIC_ENABLED } from '../../src/config/site';
import { hasFrames } from '../../src/lib/journey-files';

/** The sequence the page in hand is served. */
const sequenceFor = (isMobile: boolean) =>
  isMobile && hasFrames(journey.portrait) ? journey.portrait : journey.landscape;

/** Scrolls like a person does, so the observers see every part of the page. */
async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 120) {
    await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(2200);
}

/** Anything in the content that is transparent, outside the decorative drawings. */
const hidden = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('main *, footer *')]
      .filter(
        (el) =>
          !el.closest('svg, .walk, .walk-still, [aria-hidden="true"]') &&
          Number(getComputedStyle(el).opacity) < 1,
      )
      .map((el) => el.outerHTML.slice(0, 100)),
  );

for (const path of ARABIC_ENABLED ? ['/', '/ar'] : ['/']) {
  test(`${path}: the tactics section renders, described and labelled`, async ({ page }) => {
    await page.goto(path);
    const section = page.locator('#tactics');
    await expect(section.getByRole('heading', { level: 2 })).toHaveCount(1);
    await expect(section.locator('[data-caption]')).toHaveCount(3);
    await expect(section.locator('svg').last()).toHaveAttribute('aria-hidden', 'true');
    await expect(section.locator('.sr-only')).not.toBeEmpty();
    await expect(section.locator('.tactics-badge')).toHaveText(['P', 'C', 'M', 'O', 'R']);
    await expect(section.locator('.tactics-role b')).toHaveText(['P', 'C', 'M', 'O', 'R', 'I']);
    // An arrowhead for each pass, drawn in the finished frame too
    await expect(section.locator('[data-arrow]')).toHaveCount(3);
  });

  test(`${path}: nothing is hidden after scrolling, and nothing shifted`, async ({ page }) => {
    test.slow();
    await page.addInitScript(() => {
      const w = window as unknown as { cls: number };
      w.cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[]) {
          if (!entry.hadRecentInput) w.cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(path, { waitUntil: 'networkidle' });
    await scrollThrough(page);
    expect(await hidden(page)).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(
      0.001,
    );
    // With motion on, as visitors get it
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });
}

/** The play's endless animations: ball, 3 lines, 3 arrowheads, 3 defenders, 2 runs, the pulse. */
const LOOPS = 13;

test('the steps follow the scroll (pinned) or play by themselves (phone)', async ({
  page,
  isMobile,
}) => {
  test.slow();
  await page.goto('/', { waitUntil: 'networkidle' });
  const section = page.locator('#tactics');
  await expect(section).toHaveAttribute('data-step', 'ready');
  if (isMobile) {
    await section.locator('[data-stage]').scrollIntoViewIfNeeded();
    await expect(section).toHaveAttribute('data-step', '2', { timeout: 10_000 });
  } else {
    const { top, height } = await section.evaluate((el) => ({
      top: el.getBoundingClientRect().top + scrollY,
      height: el.clientHeight,
    }));
    for (const [step, part] of [0.2, 0.5, 0.8].entries()) {
      await page.evaluate(
        (y) => scrollTo({ top: y - innerHeight / 2, behavior: 'instant' }),
        top + height * part,
      );
      await expect(section).toHaveAttribute('data-step', String(step));
    }
  }
  const running = () =>
    section.evaluate(
      (el) =>
        el
          .getAnimations({ subtree: true })
          .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
          .length,
    );
  await expect.poll(running).toBe(LOOPS);

  // Paused on request, and whenever it is off screen
  await section.getByRole('button', { name: 'Pause' }).click();
  await expect.poll(running).toBe(0);
  await section.getByRole('button', { name: 'Pause' }).click();
  await expect.poll(running).toBe(LOOPS);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(running).toBe(0);
});

test('reduced motion: the finished frame, no pinning, no animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  const section = page.locator('#tactics');
  await section.scrollIntoViewIfNeeded();
  await expect(section).not.toHaveAttribute('data-step');
  await expect(section.locator('[data-tactics-pause]')).toBeHidden();
  for (const badge of await section.locator('.tactics-badge').all()) {
    await expect(badge).toHaveCSS('opacity', '1');
  }
  await expect(section.locator('.tactics-pin')).toHaveCSS('position', 'static');
  expect(await hidden(page)).toEqual([]);
  await expect(page.locator('[data-walk]')).toBeHidden();
  await expect(page.locator('html')).not.toHaveAttribute('data-journey');
  for (const still of await page.locator('.walk-still').all()) {
    await expect(still).toHaveCSS('background-image', /journey/);
  }
  await expect(page.locator('[data-play-pause]')).toBeHidden();
  // No smooth scrolling: the wheel scrolls as the system does
  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(500);
  await expect(page.locator('html')).not.toHaveClass(/(^|\s)lenis(\s|$)/);
  // Nothing plays by itself. The header's progress line is moved by the scroll itself (a CSS
  // scroll timeline): it shows where you are, it does not animate.
  expect(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (a) => a.playState === 'running' && a.timeline?.constructor.name !== 'ScrollTimeline',
          ).length,
    ),
  ).toBe(0);
});

test('the hero runs different plays, and pauses', async ({ page }) => {
  test.slow();
  await page.goto('/');
  const hero = page.locator('[data-hero-drill]');
  await expect(hero).toHaveAttribute('data-play', 'rondo');
  // Skip to the end of each play instead of waiting for it
  const seen: string[] = [];
  for (let i = 0; i < 6; i++) {
    seen.push((await hero.getAttribute('data-play'))!);
    await hero.evaluate((el) => {
      for (const animation of el.getAnimations({ subtree: true })) animation.finish();
    });
    await expect(hero).not.toHaveAttribute('data-play', seen[i]);
  }
  expect(new Set(seen.slice(0, 5)).size).toBe(5);
  expect(seen[5]).toBe(seen[0]);

  const running = () =>
    hero.evaluate(
      (el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
    );
  await expect.poll(running).toBeGreaterThan(7);
  await hero.getByRole('button', { name: 'Pause' }).click();
  await expect.poll(running).toBe(0);
  await hero.getByRole('button', { name: 'Pause' }).click();
  await expect.poll(running).toBeGreaterThan(7);
  await page.evaluate(() => scrollTo({ top: 3000, behavior: 'instant' }));
  await expect.poll(running).toBe(0);
});

test('the walk: from the first frame to the last, and every scroll moves it', async ({
  page,
  isMobile,
}) => {
  const sequence = sequenceFor(isMobile);
  await page.goto('/', { waitUntil: 'networkidle' });
  const walk = page.locator('[data-walk]');
  const last = String(sequence.count - 1);
  await expect(page.locator('html')).toHaveAttribute('data-journey', 'on');
  await expect(walk).toHaveAttribute('data-frame', '0');
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'locker');
  // Every frame in, so the one asked for is the one shown
  await expect
    .poll(async () => Number(await walk.getAttribute('data-loaded')), { timeout: 30_000 })
    .toBe(sequence.count);

  const to = (part: number) =>
    page.evaluate((p) => {
      const main = document.querySelector('main')!;
      const top = (main.offsetTop + main.offsetHeight - innerHeight) * p;
      scrollTo({ top, behavior: 'instant' });
    }, part);
  // Clear of a half frame, where a rounded scroll position could fall either side
  await to(0.44);
  await expect(walk).toHaveAttribute('data-frame', String(frameAt(sequence, 0.44)));
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'tunnel');
  const pixels = () => walk.evaluate((el) => (el as HTMLCanvasElement).toDataURL('image/png'));
  await to(0.3);
  await expect(walk).toHaveAttribute('data-frame', String(frameAt(sequence, 0.3)));
  await page.waitForTimeout(800);
  const before = await pixels();
  await page.evaluate(() => scrollBy({ top: 40, behavior: 'instant' }));
  await expect.poll(pixels).not.toBe(before);
  await to(1);
  await expect(walk).toHaveAttribute('data-frame', last);
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'pitch');
  // The canvas fills the screen and holds the frames at their own size, whatever the screen
  const size = await walk.evaluate((el) => {
    const { width, clientWidth } = el as HTMLCanvasElement;
    return { width, full: clientWidth >= innerWidth - 20 };
  });
  expect(size.full).toBe(true);
  expect(size.width).toBe(960);
});

test('the walk: between two frames both are drawn, crossfaded by how far along it is', async ({
  page,
  isMobile,
}) => {
  const sequence = sequenceFor(isMobile);
  await page.goto('/', { waitUntil: 'networkidle' });
  const walk = page.locator('[data-walk]');
  await expect(page.locator('html')).toHaveAttribute('data-journey', 'on');
  // Every frame in, so the neighbours are the next ones
  await expect
    .poll(async () => Number(await page.locator('[data-walk]').getAttribute('data-loaded')), {
      // Loaded 12 at a time in quiet moments: a long set takes a while
      timeout: 30_000,
    })
    .toBe(sequence.count);
  // Fetched and decoded in a worker: the page itself fetched no frame after the first paint
  expect(page.workers().length).toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () =>
        performance
          .getEntriesByType('resource')
          .filter(
            (r) =>
              r.name.includes('/journey/') &&
              (r as PerformanceResourceTiming).initiatorType === 'fetch',
          ).length,
    ),
  ).toBe(0);
  const at = 10.5;
  await page.evaluate(
    ([frame, count]) => {
      const main = document.querySelector('main')!;
      const range = main.offsetTop + main.offsetHeight - innerHeight;
      scrollTo({ top: (range * frame) / (count - 1), behavior: 'instant' });
    },
    [at, sequence.count],
  );
  // Half way between 10 and 11 (to the scroll's whole pixels): both drawn, faded by the config's
  // window round the midpoint
  await expect(walk).toHaveAttribute('data-blend', /^10 11 0\.\d{3}$/);
  const { exact, alpha } = await walk.evaluate((el) => ({
    exact: Number((el as HTMLElement).dataset.at),
    alpha: Number((el as HTMLElement).dataset.blend!.split(' ')[2]),
  }));
  const w = fadeWindow(sequence.count);
  const expected = Math.min(1, Math.max(0, (exact - 10 - (0.5 - w)) / (2 * w)));
  expect(alpha).toBeCloseTo(expected, 2);
  expect(alpha).toBeGreaterThan(0.2);
  expect(alpha).toBeLessThan(0.8);
  // A whole frame shows alone
  await page.evaluate(
    ([frame, count]) => {
      const main = document.querySelector('main')!;
      const range = main.offsetTop + main.offsetHeight - innerHeight;
      scrollTo({ top: Math.ceil((range * frame) / (count - 1)), behavior: 'instant' });
    },
    [20, sequence.count],
  );
  await expect(walk).toHaveAttribute('data-blend', /^20 (20 0\.000|21 0\.00\d)$/);
  // A quarter of the way either side of the midpoint: one frame alone, never a double image
  const window = fadeWindow(sequence.count);
  if (window < 0.25) {
    for (const [at, alpha] of [
      [10.25, '0.000'],
      [10.75, '1.000'],
    ] as const) {
      await page.evaluate(
        ([frame, count]) => {
          const main = document.querySelector('main')!;
          const range = main.offsetTop + main.offsetHeight - innerHeight;
          scrollTo({ top: (range * frame) / (count - 1), behavior: 'instant' });
        },
        [at, sequence.count],
      );
      await expect(walk).toHaveAttribute('data-blend', `10 11 ${alpha}`);
    }
  }
});

test('the walk: the very bottom of the page shows the last frame', async ({ page, isMobile }) => {
  const sequence = sequenceFor(isMobile);
  await page.goto('/', { waitUntil: 'networkidle' });
  const walk = page.locator('[data-walk]');
  await expect(page.locator('html')).toHaveAttribute('data-journey', 'on');
  for (const [part, frame] of [
    [0, '0'],
    [0.5, String(frameAt(sequence, 0.5))],
  ] as const) {
    await page.evaluate((p) => {
      const main = document.querySelector('main')!;
      scrollTo({
        top: (main.offsetTop + main.offsetHeight - innerHeight) * p,
        behavior: 'instant',
      });
    }, part);
    await expect(walk).toHaveAttribute('data-frame', frame);
  }
  // As far down as the page goes, past the footer: the pitch, the last frame
  await page.evaluate(() =>
    scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  );
  await expect(walk).toHaveAttribute('data-frame', String(sequence.count - 1));
  await expect(walk).toHaveAttribute(
    'data-blend',
    `${sequence.count - 1} ${sequence.count - 1} 0.000`,
  );
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'pitch');
});

test('the walk: a recorded scroll at 60 frames a second shows no step', async ({
  page,
  isMobile,
}) => {
  test.slow();
  const sequence = sequenceFor(isMobile);
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-journey', 'on');
  await expect
    .poll(async () => Number(await page.locator('[data-walk]').getAttribute('data-loaded')))
    .toBe(sequence.count);
  if (!isMobile) {
    await page.mouse.move(600, 400);
    await page.mouse.move(610, 410);
  }
  // Each painted frame against the one before: how much of the picture changed (0 to 255)
  await page.evaluate((count) => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-walk]')!;
    const probe = document.createElement('canvas');
    probe.width = 64;
    probe.height = 36;
    const context = probe.getContext('2d', { willReadFrequently: true })!;
    const w = window as unknown as {
      jumps: number[];
      frames: string[];
      lags: number[];
      steps: number[];
      recording: boolean;
    };
    w.steps = [];
    w.jumps = [];
    w.frames = [];
    w.lags = [];
    w.recording = true;
    const main = document.querySelector('main')!;
    const range = main.offsetTop + main.offsetHeight - innerHeight;
    let last: Uint8ClampedArray | undefined;
    let before = Number(canvas.dataset.at);
    const sample = () => {
      context.drawImage(canvas, 0, 0, 64, 36);
      const data = context.getImageData(0, 0, 64, 36).data;
      if (last) {
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          for (let c = 0; c < 3; c++) sum += Math.abs(data[i + c] - last[i + c]);
        }
        w.jumps.push(sum / (64 * 36 * 3));
        w.frames.push(canvas.dataset.frame!);
        // Where the picture is against where the page is, in frames of the walk
        const shown = Number(canvas.dataset.at);
        w.lags.push(Math.abs(Math.min(1, scrollY / range) * (count - 1) - shown));
        // How far the walk went since the last painted frame, in frames
        w.steps.push(Math.abs(shown - before));
        before = shown;
      }
      last = data;
      if (w.recording) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }, sequence.count);
  if (isMobile) {
    // A thumb dragging up the screen, 20px a frame: the walk follows the finger
    const cdp = await page.context().newCDPSession(page);
    for (let drag = 0; drag < 4; drag++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: 200, y: 700 }],
      });
      for (let i = 1; i <= 25; i++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: 200, y: 700 - i * 20 }],
        });
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
  } else {
    // Notches of a mouse wheel, glided by smooth scrolling: the walk moves with the page
    await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/);
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(60);
    }
  }
  await page.waitForTimeout(1500);
  const { jumps, frames, lags, steps } = await page.evaluate(() => {
    const w = window as unknown as {
      jumps: number[];
      frames: string[];
      lags: number[];
      steps: number[];
      recording: boolean;
    };
    w.recording = false;
    return { jumps: w.jumps, frames: w.frames, lags: w.lags, steps: w.steps };
  });
  // It passed several frames, and moved on most painted frames
  expect(new Set(frames).size).toBeGreaterThan(5);
  expect(jumps.filter((jump) => jump > 0.05).length).toBeGreaterThan(20);
  // No step: the picture changes only as far as the walk moved. A hard cut between two frames of
  // the old 48-frame set measured 41 here; neighbours in the 191-frame set up to 23.
  jumps.forEach((jump, i) => expect(jump).toBeLessThanOrEqual(30 * Math.max(1, steps[i])));
  // The picture and the page move in the same frame: it never trails behind. On touch the browser
  // scrolls on its own thread, so the walk may read it one display frame later (about 10px).
  expect(Math.max(...lags)).toBeLessThan(isMobile ? 0.15 : 0.01);
});

test('the walk: under smooth scrolling the frame still follows the page', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'smooth scrolling is for the mouse wheel; touch scrolls natively');
  const sequence = sequenceFor(isMobile);
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-journey', 'on');
  await page.mouse.move(600, 400);
  await page.mouse.move(610, 410);
  await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/);
  const y = () => page.evaluate(() => scrollY);
  // One notch glides: part of the way after a moment, all of it later
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(60);
  const early = await y();
  await expect.poll(y).toBeGreaterThan(early + 100);
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(40);
  }
  // Settled: the frame is the one for where the page is
  let last = -1;
  await expect.poll(async () => [last, (last = await y())][0] === last).toBe(true);
  const progress = await page.evaluate(() => {
    const main = document.querySelector('main')!;
    return scrollY / (main.offsetTop + main.offsetHeight - innerHeight);
  });
  expect(progress).toBeGreaterThan(0.1);
  await expect(page.locator('[data-walk]')).toHaveAttribute(
    'data-frame',
    String(frameAt(sequence, progress)),
  );
});

test('smooth scrolling: no CSS glide fights Lenis', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Lenis smooths the mouse wheel');
  await page.goto('/', { waitUntil: 'networkidle' });
  const behavior = () =>
    page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  // Before Lenis, CSS glides jumps to a section; with Lenis, CSS steps aside
  expect(await behavior()).toBe('smooth');
  await page.mouse.move(5, 5);
  await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/);
  expect(await behavior()).toBe('auto');
});

test('smooth scrolling never stops a scroll that is under way', async ({ page }) => {
  // Opening a link to a section glides there; the takeover must wait until it has arrived
  await page.goto('/#faq');
  const top = () => page.locator('#faq').evaluate((el) => el.getBoundingClientRect().top);
  await expect.poll(top, { timeout: 8000 }).toBeLessThan(120);
  expect(await top()).toBeGreaterThan(40);
  await page.mouse.move(5, 5);
  await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/);
  await page.waitForTimeout(500);
  expect(Math.abs((await top()) - 88)).toBeLessThan(30);
});

test('the walk: open gaps, with no titles on them', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const gaps = page.locator('[data-walk-gap]');
  await expect(gaps).toHaveCount(8);
  await expect(page.locator('html')).toHaveAttribute('data-journey', 'on');
  for (const gap of await gaps.all()) {
    await gap.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(gap).toHaveAttribute('data-in');
    await expect(gap).toBeEmpty();
    const share = await gap.evaluate((el) => (el as HTMLElement).offsetHeight / innerHeight);
    expect(share).toBeGreaterThanOrEqual(0.59);
    expect(share).toBeLessThanOrEqual(0.81);
  }
});

test('the walk: saving data loads every second frame', async ({ page, isMobile }) => {
  const sequence = sequenceFor(isMobile);
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'connection', { value: { saveData: true } }),
  );
  const frames = new Set<string>();
  page.on('request', (request) => {
    if (request.url().includes('/journey/')) frames.add(request.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect.poll(() => frames.size).toBe(Math.ceil(sequence.count / 2));
});

/** Serves the page as it is built with a portrait set, whether or not there is one yet. */
async function withPortrait(page: Page, files: 'there' | 'failing') {
  await page.route('/', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /<canvas data-walk="true"( data-portrait="")?/,
      '<canvas data-walk="true" data-portrait=""',
    );
    await route.fulfill({ response, body });
  });
  await page.route(`**${journey.portrait.path}*`, (route) => {
    if (files === 'failing') return route.fulfill({ status: 404 });
    const name = route.request().url().split('/').pop();
    return route.fulfill({ path: `public/journey/seq/${name}` });
  });
  const asked: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/journey/')) asked.push(new URL(request.url()).pathname);
  });
  return (shape: 'landscape' | 'portrait') =>
    // The first frame is also the CSS background of the page as it was built
    asked.filter((path) => path.startsWith(journey[shape].path) && !path.includes('f000')).length;
}

test('the walk: tall screens load only the portrait set, and turning loads the other', async ({
  page,
}) => {
  test.slow();
  const asked = await withPortrait(page, 'there');
  await page.setViewportSize({ width: 412, height: 839 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const walk = page.locator('[data-walk]');
  await expect(walk).toHaveAttribute('data-shape', 'portrait');
  await expect.poll(() => asked('portrait'), { timeout: 20_000 }).toBe(journey.portrait.count - 1);
  expect(asked('landscape')).toBe(0);

  // A keyboard: shorter, not wider
  await page.setViewportSize({ width: 412, height: 380 });
  await page.waitForTimeout(500);
  await expect(walk).toHaveAttribute('data-shape', 'portrait');
  expect(asked('landscape')).toBe(0);

  await page.setViewportSize({ width: 839, height: 412 });
  await expect(walk).toHaveAttribute('data-shape', 'landscape');
  await expect
    // 191 frames come in at quiet moments: allow for a busy machine
    .poll(() => asked('landscape'), { timeout: 40_000 })
    .toBe(journey.landscape.count - 1);
  // And back, without loading anything again
  await page.setViewportSize({ width: 412, height: 839 });
  await expect(walk).toHaveAttribute('data-shape', 'portrait');
  expect(asked('portrait')).toBe(journey.portrait.count - 1);
});

test('the walk: wide screens load only the landscape set', async ({ page }) => {
  const asked = await withPortrait(page, 'there');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-walk]')).toHaveAttribute('data-shape', 'landscape');
  await expect
    .poll(() => asked('landscape'), { timeout: 20_000 })
    .toBe(journey.landscape.count - 1);
  expect(asked('portrait')).toBe(0);
});

test('the walk: falls back to landscape when the portrait set fails', async ({ page }) => {
  const asked = await withPortrait(page, 'failing');
  await page.setViewportSize({ width: 412, height: 839 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-walk]')).toHaveAttribute('data-shape', 'landscape');
  await expect
    .poll(() => asked('landscape'), { timeout: 20_000 })
    .toBe(journey.landscape.count - 1);
});

test('the walk: without a portrait folder nothing asks for it', async ({ page }) => {
  test.skip(hasFrames(journey.portrait), 'There is a portrait set');
  const asked: string[] = [];
  page.on('request', (request) => asked.push(request.url()));
  await page.setViewportSize({ width: 412, height: 839 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('[data-walk]')).toHaveAttribute('data-shape', 'landscape');
  expect(asked.filter((url) => url.includes('/portrait/'))).toEqual([]);
});

test('the walk: without a canvas or its frames, still pictures', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-journey', 'off');
  await expect(page.locator('[data-walk]')).toBeHidden();
  await expect(page.locator('.walk-still')).toHaveCount(3);
  for (const still of await page.locator('.walk-still').all()) {
    await expect(still).toHaveCSS('background-image', /journey/);
    await expect(still).toHaveCSS('position', 'sticky');
  }
});

test('cards: a light and a lean follow the mouse; touch screens only get the reveal', async ({
  page,
  isMobile,
}) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-journey', 'on');
  const why = page.locator('#why-title + ul [data-spotlight]');
  await expect(why).toHaveCount(3);
  // Every feature card has its photo in the same shape (the carousel: tests/e2e/chrome.spec.ts)
  for (const art of await page.locator('#features .feature-photo').all()) {
    const box = (await art.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(4 / 3, 1);
  }
  const card = why.nth(1);
  await card.scrollIntoViewIfNeeded();
  const style = () =>
    card.evaluate((el) => ({
      on: Number(getComputedStyle(el).getPropertyValue('--spot-on') || 0),
      transform: getComputedStyle(el).transform,
    }));
  if (isMobile) {
    await card.tap();
    await page.waitForTimeout(600);
    expect(await style()).toEqual({ on: 0, transform: 'none' });
    return;
  }
  // GSAP comes with the first sign of use
  await page.mouse.move(5, 5);
  await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/);
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3, { steps: 5 });
  await expect.poll(async () => (await style()).on).toBeGreaterThan(0.9);
  expect((await style()).transform).toMatch(/^matrix3d/);
  // The title's underline is drawn
  await expect(card.locator('.card-title')).toHaveCSS('background-size', '100% 3px');
  await page.mouse.move(5, 5);
  await expect.poll(async () => (await style()).on).toBeLessThan(0.05);
});

test('cards below the screen rise in, one after the other, when they come into view', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-journey', 'on');
  await page.evaluate(() => scrollTo({ top: 1, behavior: 'instant' }));
  const cards = page.locator('#features [data-card-reveal]');
  const opacity = (i: number) => cards.nth(i).evaluate((el) => getComputedStyle(el).opacity);
  await expect.poll(() => opacity(0)).toBe('0');
  // Still there for assistive tech while it waits
  await expect(cards.first()).toBeVisible();
  await page.locator('#features').evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
  await expect.poll(() => opacity(0)).toBe('1');
  await cards.nth(2).evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect.poll(() => opacity(2)).toBe('1');
});

test('inside the app: three screens a view, arrows, dots and keys on phones', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const coach = page.getByRole('tabpanel', { name: 'Coach view' });
  const player = page.getByRole('tabpanel', { name: 'Player view' });
  await expect(coach.getByRole('listitem')).toHaveCount(3);
  await expect(player).toBeHidden();

  const current = coach.locator('[data-current]');
  await coach.scrollIntoViewIfNeeded();
  const next = coach.getByRole('button', { name: 'Next screen' });
  if (isMobile) {
    await expect(current).toContainText('Calendar');
    await next.click();
    await expect(current).toContainText('Roles');
    const list = coach.getByRole('list');
    await list.focus();
    await page.keyboard.press('ArrowRight');
    await expect(current).toContainText('Coaches Channel');
    await expect(next).toBeDisabled();
    await page.keyboard.press('ArrowLeft');
    await expect(current).toContainText('Roles');
  } else {
    // All three side by side, the middle one in front: nothing to turn
    await expect(current).toContainText('Roles');
    await expect(next).toBeHidden();
    const width = page.viewportSize()!.width;
    for (const phone of await coach.locator('.phone').all()) {
      const box = (await phone.boundingBox())!;
      expect(box.x).toBeGreaterThan(0);
      expect(box.x + box.width).toBeLessThan(width);
    }
  }

  await page.getByRole('tab', { name: 'Coach view' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Player view' })).toBeFocused();
  await expect(coach).toBeHidden();
  // Players have no channel in the app
  await expect(player.getByRole('listitem')).toHaveCount(3);
  await expect(player).not.toContainText(/channel/i);
});

for (const path of ARABIC_ENABLED ? ['/', '/ar'] : ['/']) {
  test(`${path}: every screen is real, and loads`, async ({ page }) => {
    await page.goto(path);
    // No sketch is left: every phone has its picture; the player view ends on the player card
    for (const view of ['coach', 'player']) {
      const phones = page.locator(`#view-${view} .phone`);
      await expect(phones.locator('img')).toHaveCount(await phones.count());
      await expect(phones.locator('.phone-sketch')).toHaveCount(0);
    }
    await expect(page.locator('#view-player .player-card')).toHaveCount(1);
    const roles = page.locator('.phone img[src*="coach-whiteboard-roles.png"]');
    for (const role of ['Press', 'Cover', 'Mark', 'Intercept']) {
      await expect(roles).toHaveAttribute('alt', new RegExp(role));
    }
    for (const name of [
      'coach-calendar',
      'coach-whiteboard-roles',
      'coach-channel',
      'player-home',
      'player-event',
    ]) {
      const image = page.locator(`.phone img[src*="${name}.png"]`);
      await expect(image).toHaveCount(1);
      const url = (await image.getAttribute('src'))!;
      const response = await page.request.get(url);
      expect(response.status(), name).toBe(200);
      expect(response.headers()['content-type'], name).toMatch(/^image/);
    }
  });
}

test('inside the app: big phones with a glow, big tabs, and the pill glides', async ({
  page,
  isMobile,
}) => {
  // The widths the brief names: a 1440px computer, a 390px phone
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const view = page.locator('#view-coach');
  await view.scrollIntoViewIfNeeded();
  const phones = view.locator('.phone');
  const widths = await phones.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().width),
  );
  const screen = page.viewportSize()!.width;
  if (isMobile) {
    // One big phone at a time, the next one peeking in
    expect(Math.max(...widths)).toBeGreaterThan(screen * 0.6);
  } else {
    // About 300px each, three side by side
    // About 340px each, three side by side
    expect(Math.max(...widths)).toBeGreaterThanOrEqual(320);
    expect(Math.max(...widths)).toBeLessThanOrEqual(350);
    const boxes = await phones.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
    for (const box of boxes) expect(box.right).toBeLessThanOrEqual(screen);
  }
  // A soft glow behind each, no hard border
  await expect(view.locator('.phone-glow')).toHaveCount(3);
  // Three frames for contrast on the charcoal: black, orange in the middle, white
  expect(await phones.evaluateAll((els) => els.map((el) => el.getAttribute('data-look')))).toEqual([
    'black',
    'orange',
    'white',
  ]);
  for (const phone of await phones.all()) await expect(phone).toHaveCSS('outline-style', 'none');
  // Tabs: 44px tall at least, 16px text; captions 16px and up
  const tabs = page.locator('#inside [role="tab"]');
  for (const tab of await tabs.all()) {
    expect((await tab.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(
      parseFloat(await tab.evaluate((el) => getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
  }
  const title = view.locator('figcaption .text-lg').first();
  expect(
    parseFloat(await title.evaluate((el) => getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(18);
  const text = view.locator('figcaption .text-muted').first();
  expect(
    parseFloat(await text.evaluate((el) => getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  // With GSAP in, one pill glides to the chosen tab
  if (isMobile) await page.touchscreen.tap(5, 300);
  else await page.mouse.move(5, 5);
  const pill = page.locator('#inside .tab-pill');
  await expect(pill).toHaveCount(1);
  const left = () => pill.evaluate((el) => el.getBoundingClientRect().left);
  const tab = (i: number) => tabs.nth(i).evaluate((el) => el.getBoundingClientRect().left);
  await expect.poll(left).toBeCloseTo(await tab(0), 0);
  await tabs.nth(1).click();
  await expect.poll(left).toBeCloseTo(await tab(1), 0);
});

for (const path of ARABIC_ENABLED ? ['/', '/ar'] : ['/']) {
  test(`${path}: a phone opens what its screen does, in a dialog`, async ({ page, isMobile }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    const phone = page.locator('#view-coach .phone-button').first();
    await phone.scrollIntoViewIfNeeded();
    await expect(phone).toHaveAttribute('aria-haspopup', 'dialog');
    // By keyboard: Enter opens it
    await phone.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-labelledby', 'screen-dialog-title');
    await expect(page.locator('#screen-dialog-title')).not.toBeEmpty();
    await expect(dialog.locator('.screen-dialog-facts li')).toHaveCount(3);
    await expect(dialog.locator('a[href="#pre-register"]')).toBeVisible();
    // Focus starts on Close and stays inside
    await expect(dialog.locator('.screen-dialog-close')).toBeFocused();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    // Esc closes it and gives focus back to the phone
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(phone).toBeFocused();
    // By mouse or finger too, and the close button closes it
    if (isMobile) await phone.tap();
    else await phone.click();
    await expect(dialog).toBeVisible();
    await dialog.locator('.screen-dialog-close').click();
    await expect(dialog).toBeHidden();
  });
}

test('inside the app: the player card, as the app draws it, leaning like the phones', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#tab-player').click();
  const card = page.locator('#view-player .player-card');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('role', 'img');
  await expect(card).toHaveAttribute('aria-label', /example/i);
  // Inside React Bits' TiltedCard, with a ring, a position badge, six bars and a stock photo
  await expect(card.locator('xpath=ancestor::*[@data-tilt]')).toHaveCount(1);
  await expect(card.locator('.player-card-ring circle')).toHaveCount(2);
  await expect(card.locator('.player-card-badge')).toHaveCount(1);
  await expect(card.locator('.player-card-bars li')).toHaveCount(6);
  await card.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      card.locator('.player-card-photo').evaluate((el) => (el as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(page.locator('body')).not.toContainText(/FIFA/i);
});

test('plan, build, organize: each card opens for a closer look, 18px text', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const buttons = page.locator('.why-button');
  await expect(buttons).toHaveCount(3);
  for (const button of await buttons.all()) {
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  }
  const first = buttons.first();
  const panel = page.locator('#why-a-0');
  await expect(panel.locator('p')).toBeHidden();
  await first.scrollIntoViewIfNeeded();
  await first.click();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expect(panel.locator('p')).toBeVisible();
  await expect(panel.locator('svg')).toBeVisible();
  for (const text of await page.locator('.why-card p').all()) {
    expect(
      parseFloat(await text.evaluate((el) => getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(18);
  }
  // By keyboard too
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
});

for (const reduced of [false, true]) {
  test(`the whiteboard: roles are buttons that move the defenders${reduced ? ', at once with reduced motion' : ''}`, async ({
    page,
  }) => {
    if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });
    const chips = page.locator('[data-try]');
    await expect(chips).toHaveText(['Smart', 'Press', 'Cover', 'Mark', 'Intercept']);
    await expect(chips.first()).toHaveAttribute('aria-pressed', 'true');
    const where = () =>
      page.locator('[data-defender]').evaluateAll((els) =>
        els.map((el) => {
          const m = new DOMMatrix(getComputedStyle(el).transform);
          return [Math.round(m.e), Math.round(m.f)];
        }),
      );
    const press = page.locator('[data-try="press"]');
    await press.scrollIntoViewIfNeeded();
    await press.click();
    await expect(press).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-tactics]')).toHaveAttribute('data-role', 'press');
    // With reduced motion there and then, as soon as the click lands; otherwise after the glide
    await expect.poll(where, { timeout: reduced ? 1000 : 5000 }).toEqual(ROLE_SHAPES.press);
    await expect(page.locator('.tactics-try + p')).toContainText('Press');
    // Arrow keys move along and choose
    await press.focus();
    await page.keyboard.press('ArrowRight');
    const cover = page.locator('[data-try="cover"]');
    await expect(cover).toBeFocused();
    await expect(cover).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(where).toEqual(ROLE_SHAPES.cover);
    // Mark draws who marks whom
    await page.locator('[data-try="mark"]').click();
    await expect(page.locator('[data-show="mark"]').first()).toHaveCSS('opacity', '1');
    // Smart gives the board back to the play
    await page.locator('[data-try="smart"]').click();
    await expect(page.locator('[data-tactics]')).not.toHaveAttribute('data-role', /./);
  });
}

test('inside the app: the phones beside the middle one float with the scroll', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'one phone at a time on a phone: nothing to float against');
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-journey', 'on');
  await page.mouse.move(5, 5);
  await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/);
  const figures = page.locator('#view-coach figure[data-parallax]');
  const y = (i: number) =>
    figures.nth(i).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
  const section = page.locator('#inside');
  const at = async (part: number) => {
    await section.evaluate((el, p) => {
      const { top, height } = el.getBoundingClientRect();
      scrollTo({
        top: top + scrollY - innerHeight + (height + innerHeight) * p,
        behavior: 'instant',
      });
    }, part);
    await page.waitForTimeout(900);
    return [await y(0), await y(1), await y(2)];
  };
  const early = await at(0.3);
  const late = await at(0.7);
  expect(early[1]).toBe(0);
  expect(late[1]).toBe(0);
  expect(early[0]).toBeGreaterThan(late[0] + 5);
  expect(early[2]).toBeGreaterThan(late[2] + 5);
});

test('inside the app: undistorted phones, the one in front larger, tilting to the mouse', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const slides = page.locator('#view-coach .showcase-slide');
  await slides.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const at = isMobile ? 0 : 1;
  await expect(slides.nth(at)).toHaveAttribute('data-current');
  // The screenshot keeps its own shape under the status bar
  const shot = await slides
    .first()
    .locator('.phone-shot img')
    .evaluate((el) => {
      const img = el as HTMLImageElement;
      return { shown: img.offsetHeight / img.offsetWidth, own: 2532 / 1170 };
    });
  expect(shot.shown).toBeCloseTo(shot.own, 2);
  const width = (i: number) =>
    slides
      .nth(i)
      .locator('.phone')
      .evaluate((el) => el.getBoundingClientRect().width);
  expect(await width(at)).toBeGreaterThan(await width(at + 1));
  if (isMobile) {
    // Part of the next screen shows
    const next = (await slides
      .nth(at + 1)
      .locator('.phone')
      .boundingBox())!;
    expect(page.viewportSize()!.width - 20 - next.x).toBeGreaterThan(16);
  }

  // React Bits TiltedCard, on GSAP: it turns towards the mouse, and a glare follows
  const tilt = slides.nth(at).locator('[data-tilt]');
  const transform = () => tilt.evaluate((el) => getComputedStyle(el).transform);
  if (isMobile) return;
  await page.mouse.move(5, 5);
  await expect(page.locator('html')).toHaveClass(/(^|\s)lenis(\s|$)/);
  const box = (await tilt.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.5, { steps: 4 });
  await expect.poll(transform).toContain('matrix3d');
  await expect
    .poll(() => tilt.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--tc-glare'))))
    .toBeGreaterThan(0.3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(transform).toBe('none');
});

for (const width of [360, 390, 430, 1440]) {
  test(`at ${width}px: nothing sideways, 44px targets, readable text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const path of [...(ARABIC_ENABLED ? ['/', '/ar'] : ['/']), '/privacy']) {
      await page.goto(path);
      const found = await page.evaluate(() => {
        const size = (el: Element) => el.getBoundingClientRect();
        const targets = 'a, button, select, label.role-chip, input[type=text]';
        return {
          sideways: document.documentElement.scrollWidth - innerWidth,
          small: [...document.querySelectorAll(targets)]
            .filter((el) => size(el).width > 1 && !el.closest('[inert], [aria-hidden=true]'))
            .filter((el) => size(el).width < 43.5 || size(el).height < 43.5)
            .map((el) => el.outerHTML.slice(0, 120)),
          tiny: [...document.querySelectorAll('body *')]
            // The phones' clock and tab labels are part of the picture, like a screenshot's text
            .filter((el) => !el.closest('svg, script, [aria-hidden="true"]') && size(el).width > 1)
            .filter((el) =>
              [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()),
            )
            .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14)
            .map((el) => el.outerHTML.slice(0, 80)),
        };
      });
      expect(found, path).toEqual({ sideways: 0, small: [], tiny: [] });
    }
  });
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('everything is there', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#tactics .tactics-pin')).toHaveCSS('position', 'static');
    await expect(page.locator('[data-walk]')).toBeHidden();
    await expect(page.locator('.walk-still').first()).toHaveCSS('background-image', /f000/);
    for (const view of await page.locator('.showcase-view').all()) await expect(view).toBeVisible();
    for (const el of await page.locator('[data-reveal]').all()) {
      await expect(el).toHaveCSS('opacity', '1');
    }
    // Every answer is open, and its link works
    for (const answer of await page.locator('.faq-panel p').all()) {
      await expect(answer).toBeVisible();
    }
  });
});
