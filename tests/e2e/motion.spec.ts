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
      .filter((el) => !el.closest('svg, .scene') && Number(getComputedStyle(el).opacity) < 1)
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
    // Scroll-linked scenes are drawings, aria-hidden
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
  for (const scene of await page.locator('.scene').all()) {
    await expect(scene).toHaveCSS('position', 'sticky');
    await expect(scene).toHaveCSS('opacity', '1');
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

test('the journey shows its three scenes in turn, behind the content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const opacity = (scene: string) =>
    page
      .locator(`[data-journey=${scene}] .scene`)
      .evaluate((el) => Number(getComputedStyle(el).opacity));
  const scenes = ['locker', 'tunnel', 'pitch'];
  for (const [i, scene] of scenes.entries()) {
    await page
      .locator(`[data-journey=${scene}]`)
      .evaluate((el) =>
        scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' }),
      );
    await expect.poll(() => opacity(scene)).toBe(1);
    if (scenes[i + 1]) expect(await opacity(scenes[i + 1])).toBe(0);
  }
  await expect(page.locator('#f-name')).toBeVisible();
});

test('inside the app: views, arrows, dots and keys', async ({ page }) => {
  await page.goto('/');
  const coach = page.getByRole('tabpanel', { name: 'Coach view' });
  const player = page.getByRole('tabpanel', { name: 'Player view' });
  await expect(coach.getByRole('listitem')).toHaveCount(5);
  await expect(player).toBeHidden();

  const dot = (name: string) => coach.getByRole('button', { name, exact: true });
  await coach.getByRole('button', { name: 'Next screen' }).click();
  await expect(dot('Calendar')).toHaveAttribute('aria-current', 'true');
  await dot('Coaches Channel').click();
  await expect(dot('Coaches Channel')).toHaveAttribute('aria-current', 'true');
  await expect(coach.getByRole('button', { name: 'Next screen' })).toBeDisabled();
  await coach.getByRole('list').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(dot('Squad')).toHaveAttribute('aria-current', 'true');

  await page.getByRole('tab', { name: 'Coach view' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Player view' })).toBeFocused();
  await expect(coach).toBeHidden();
  // Not in the app yet, so it says so
  await expect(player.getByRole('listitem').filter({ hasText: 'Your team channel' })).toContainText(
    'Coming soon',
  );
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('everything is there', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#tactics .tactics-pin')).toHaveCSS('position', 'static');
    for (const view of await page.locator('.showcase-view').all()) await expect(view).toBeVisible();
    for (const el of await page.locator('[data-reveal]').all()) {
      await expect(el).toHaveCSS('opacity', '1');
    }
  });
});
