import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { frameAt, journey } from '../../src/config/journey.config';
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
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
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

  const to = (part: number) =>
    page.evaluate((p) => {
      const main = document.querySelector('main')!;
      const top = (main.offsetTop + main.offsetHeight - innerHeight) * p;
      scrollTo({ top, behavior: 'instant' });
    }, part);
  await to(0.45);
  await expect(walk).toHaveAttribute('data-frame', String(frameAt(sequence, 0.45)));
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
  // The canvas fills the screen, at no more than two pixels per point
  const size = await walk.evaluate((el) => {
    const { width, clientWidth } = el as HTMLCanvasElement;
    return { ratio: width / clientWidth, full: clientWidth >= innerWidth - 20 };
  });
  expect(size.full).toBe(true);
  expect(size.ratio).toBeLessThanOrEqual(2.01);
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
    .poll(() =>
      page.evaluate(
        () =>
          performance.getEntriesByType('resource').filter((r) => r.name.includes('/journey/'))
            .length,
      ),
    )
    .toBeGreaterThanOrEqual(sequence.count);
  const at = 10.5;
  await page.evaluate(
    ([frame, count]) => {
      const main = document.querySelector('main')!;
      const range = main.offsetTop + main.offsetHeight - innerHeight;
      scrollTo({ top: (range * frame) / (count - 1), behavior: 'instant' });
    },
    [at, sequence.count],
  );
  await expect(walk).toHaveAttribute('data-blend', /^10 11 0\.(4[6-9]|5[0-4])\d$/);
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
    .poll(() =>
      page.evaluate(
        () =>
          performance.getEntriesByType('resource').filter((r) => r.name.includes('/journey/'))
            .length,
      ),
    )
    .toBeGreaterThanOrEqual(sequence.count);
  // Each painted frame against the one before: how much of the picture changed (0 to 255)
  await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-walk]')!;
    const probe = document.createElement('canvas');
    probe.width = 64;
    probe.height = 36;
    const context = probe.getContext('2d', { willReadFrequently: true })!;
    const w = window as unknown as { jumps: number[]; frames: string[]; recording: boolean };
    w.jumps = [];
    w.frames = [];
    w.recording = true;
    let last: Uint8ClampedArray | undefined;
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
      }
      last = data;
      if (w.recording) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  // Notches of a mouse wheel: 100px at a time
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => scrollBy({ top: 100, behavior: 'instant' }));
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1500);
  const { jumps, frames } = await page.evaluate(() => {
    const w = window as unknown as { jumps: number[]; frames: string[]; recording: boolean };
    w.recording = false;
    return { jumps: w.jumps, frames: w.frames };
  });
  // It passed several frames, and moved on most painted frames
  expect(new Set(frames).size).toBeGreaterThan(5);
  expect(jumps.filter((jump) => jump > 0.05).length).toBeGreaterThan(60);
  // A hard swap between two frames measured about 40 here; a crossfade stays far below
  expect(Math.max(...jumps)).toBeLessThan(12);
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
    .poll(() => asked('landscape'), { timeout: 20_000 })
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
  const features = page.locator('#features [data-spotlight]');
  await expect(why).toHaveCount(3);
  await expect(features).toHaveCount(7);
  // Each feature has a picture slot, the same shape whether it holds a picture or not
  for (const art of await page.locator('#features .feature-art').all()) {
    const box = (await art.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(1.6, 1);
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
    // No sketch is left: every slide has its picture
    for (const view of ['coach', 'player']) {
      const slides = page.locator(`#view-${view} .showcase-slide`);
      await expect(slides.locator('.phone img')).toHaveCount(await slides.count());
      await expect(slides.locator('.phone svg')).toHaveCount(0);
    }
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
      'player-card',
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
  const screen = await slides
    .first()
    .locator('.phone-screen')
    .evaluate((el) => (el as HTMLElement).offsetHeight / (el as HTMLElement).offsetWidth);
  expect(screen).toBeCloseTo(19.5 / 9, 1);
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

  const transform = () =>
    slides
      .nth(at)
      .locator('.phone')
      .evaluate((el) => getComputedStyle(el).transform);
  if (isMobile) return;
  const box = (await slides.nth(at).locator('.phone').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.5);
  await expect.poll(transform).toContain('matrix3d');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(transform).toBe('none');
});

for (const width of [360, 390, 430]) {
  test(`phones at ${width}px: nothing sideways, 44px targets, readable text`, async ({ page }) => {
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
            .filter((el) => !el.closest('svg, script') && size(el).width > 1)
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
