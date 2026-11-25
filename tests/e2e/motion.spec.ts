import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

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
    await expect(section.locator('.tactics-badge')).toHaveCount(3);
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
  await expect.poll(running).toBe(7);

  // Paused on request, and whenever it is off screen
  await section.getByRole('button', { name: 'Pause' }).click();
  await expect.poll(running).toBe(0);
  await section.getByRole('button', { name: 'Pause' }).click();
  await expect.poll(running).toBe(7);
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
  expect(
    await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('everything is there', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#tactics .tactics-pin')).toHaveCSS('position', 'static');
    for (const el of await page.locator('[data-reveal]').all()) {
      await expect(el).toHaveCSS('opacity', '1');
    }
  });
});
