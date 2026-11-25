import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { frameAt, journey } from '../../src/config/journey.config';
import { ARABIC_ENABLED } from '../../src/config/site';

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
      .filter((el) => !el.closest('svg') && Number(getComputedStyle(el).opacity) < 1)
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
  await expect.poll(running).toBe(9);

  // Paused on request, and whenever it is off screen
  await section.getByRole('button', { name: 'Pause' }).click();
  await expect.poll(running).toBe(0);
  await section.getByRole('button', { name: 'Pause' }).click();
  await expect.poll(running).toBe(9);
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

test('the walk: from the first frame to the last, and every scroll moves it', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const walk = page.locator('[data-walk]');
  const last = String(journey.count - 1);
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
  await expect(walk).toHaveAttribute('data-frame', String(frameAt(0.45)));
  await expect(page.locator('html')).toHaveAttribute('data-scene', 'tunnel');
  const pixels = () => walk.evaluate((el) => (el as HTMLCanvasElement).toDataURL('image/png'));
  await to(0.3);
  await expect(walk).toHaveAttribute('data-frame', String(frameAt(0.3)));
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

test('the walk: open gaps carry the label of the scene', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const gaps = page.locator('[data-walk-gap]');
  await expect(gaps).toHaveCount(8);
  for (const [i, label] of [
    [0, 'The locker room'],
    [3, 'The tunnel'],
    [7, 'The pitch'],
  ] as const) {
    const gap = gaps.nth(i);
    await gap.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(gap.locator('p:visible')).toHaveText(label);
    const share = await gap.evaluate((el) => el.clientHeight / innerHeight);
    expect(share).toBeGreaterThanOrEqual(0.59);
    expect(share).toBeLessThanOrEqual(0.81);
  }
});

test('the walk: saving data loads every second frame', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'connection', { value: { saveData: true } }),
  );
  const frames = new Set<string>();
  page.on('request', (request) => {
    if (request.url().includes(journey.path)) frames.add(request.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect.poll(() => frames.size).toBe(Math.ceil(journey.count / 2));
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

test('inside the app: views, arrows, dots and keys', async ({ page, isMobile }) => {
  await page.goto('/');
  const coach = page.getByRole('tabpanel', { name: 'Coach view' });
  const player = page.getByRole('tabpanel', { name: 'Player view' });
  await expect(coach.getByRole('listitem')).toHaveCount(8);
  await expect(player).toBeHidden();

  const current = coach.locator('[data-current]');
  await coach.getByRole('button', { name: 'Next screen' }).click();
  await expect(current).toContainText('Calendar');
  const list = coach.getByRole('list');
  if (isMobile) {
    for (let i = 2; i < 8; i++) {
      await list.focus();
      await page.keyboard.press('ArrowRight');
      await expect(current).toHaveCount(1);
      await expect(coach.getByRole('listitem').nth(i)).toHaveAttribute('data-current');
    }
  } else {
    await coach.getByRole('button', { name: 'Coaches Channel', exact: true }).click();
  }
  await expect(current).toContainText('Coaches Channel');
  await expect(coach.getByRole('button', { name: 'Next screen' })).toBeDisabled();
  await list.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(current).toContainText('Player card');

  await page.getByRole('tab', { name: 'Coach view' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Player view' })).toBeFocused();
  await expect(coach).toBeHidden();
  // Players have no channel in the app
  await expect(player.getByRole('listitem')).toHaveCount(3);
  await expect(player).not.toContainText(/channel/i);
});

test('inside the app: undistorted phones, the one in front larger, tilting to the mouse', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const slides = page.locator('#view-coach .showcase-slide');
  await slides.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
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
  expect(await width(0)).toBeGreaterThan(await width(1));
  // Part of the next screen shows
  const next = (await slides.nth(1).locator('.phone').boundingBox())!;
  expect(page.viewportSize()!.width - 20 - next.x).toBeGreaterThan(16);

  const transform = () =>
    slides
      .first()
      .locator('.phone')
      .evaluate((el) => getComputedStyle(el).transform);
  if (isMobile) return;
  const box = (await slides.first().locator('.phone').boundingBox())!;
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
        const targets = 'a, button, select, summary, label.role-chip, input[type=text]';
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
  });
});
