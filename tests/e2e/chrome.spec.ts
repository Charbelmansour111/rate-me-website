import { expect, test, type Page } from '@playwright/test';

import { journey } from '../../src/config/journey.config';
import { STAGE_STEPS, stageAt, stageColors } from '../../src/config/stages';
import { ARABIC_ENABLED } from '../../src/config/site';

/** Wakes the motion code (it waits for the first sign of use) and waits for it. */
async function wake(page: Page) {
  await page.mouse.move(300, 300);
  await page.mouse.move(320, 320);
  await expect(page.locator('html')).toHaveAttribute('data-stages', 'live');
}

/** Scrolls to a share of the page and waits for the frame to settle. */
async function scrollToShare(page: Page, share: number) {
  await page.evaluate((s) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: max * s, behavior: 'instant' });
  }, share);
  await page.waitForTimeout(700);
}

/** Where the walk is (0 to 1) and the panels' surface colour, as the page has them. */
const walkState = (page: Page) =>
  page.evaluate((count) => {
    const at = Number(document.querySelector<HTMLElement>('[data-walk]')!.dataset.at);
    return {
      progress: at / (count - 1),
      surface: getComputedStyle(document.documentElement).getPropertyValue('--st-surface').trim(),
    };
  }, journey.landscape.count);

test.describe('the panels follow the walk', () => {
  test.skip(({ isMobile }) => isMobile, 'the same code on every screen; once is enough');

  test('locker room, tunnel, field: each at its own progress, blended across a boundary', async ({
    page,
  }) => {
    test.slow();
    await page.goto('/', { waitUntil: 'networkidle' });
    await wake(page);
    const seen: string[] = [];
    for (const share of [0, 0.1, 0.2, 0.25, 0.4, 0.55, 0.62, 0.8, 1]) {
      await scrollToShare(page, share);
      const { progress, surface } = await walkState(page);
      // The colours are the ones the config gives for this point of the walk
      const step = Math.round(progress * STAGE_STEPS) / STAGE_STEPS;
      expect(surface, `at ${progress.toFixed(3)}`).toBe(stageAt(step).surface);
      seen.push(surface);
    }
    expect(seen).toContain(stageColors.locker.surface);
    expect(seen).toContain(stageColors.tunnel.surface);
    expect(seen).toContain(stageColors.field.surface);
    // Somewhere in between, neither stage: a blend, not a pop
    expect(seen.some((s) => !Object.values(stageColors).some((c) => c.surface === s))).toBeTruthy();
  });

  test('reduced motion: each part has its stage, the same as the end state with motion', async ({
    browser,
  }) => {
    const calm = await browser.newPage({ reducedMotion: 'reduce' });
    await calm.goto('/');
    const panels = (page: Page) =>
      page.evaluate(() =>
        [...document.querySelectorAll('.walk-group')].map((group) => ({
          stage: (group as HTMLElement).dataset.stage,
          ground: getComputedStyle(group.querySelector('.panel')!).backgroundColor,
        })),
      );
    const still = await panels(calm);
    expect(still.map((p) => p.stage)).toEqual(['locker', 'tunnel', 'field']);
    expect(new Set(still.map((p) => p.ground)).size).toBe(3);
    await expect(calm.locator('html')).not.toHaveAttribute('data-stages', 'live');

    // With motion, at the bottom: the field's colours, exactly as the still page has them
    const moving = await browser.newPage();
    await moving.goto('/', { waitUntil: 'networkidle' });
    await wake(moving);
    await scrollToShare(moving, 1);
    const end = await panels(moving);
    expect(end[2].ground).toBe(still[2].ground);
    const footer = (page: Page) =>
      page.locator('footer').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await footer(moving)).toBe(await footer(calm));
    await calm.close();
    await moving.close();
  });
});

test.describe('the header', () => {
  test('see-through at the top, solid once the page moves; the progress line follows', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const bar = page.locator('.site-bar');
    await expect(bar).toHaveAttribute('data-top');
    await wake(page);
    await scrollToShare(page, 0.5);
    await expect(bar).not.toHaveAttribute('data-top');
    const progress = () =>
      bar.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--page-progress')));
    expect(await progress()).toBeGreaterThan(0.45);
    expect(await progress()).toBeLessThan(0.55);
    await scrollToShare(page, 1);
    expect(await progress()).toBeGreaterThan(0.99);
  });

  test('the section being read is marked in the nav', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the nav is in the menu on a phone');
    await page.goto('/#inside');
    await expect(page.locator('.bar-nav [aria-current="location"]')).toHaveAttribute(
      'href',
      '/#inside',
    );
  });

  test('on a phone: a menu button opens the navigation in a dialog, and gives focus back', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'a computer shows the nav in the bar');
    await page.goto('/');
    const button = page.locator('.bar-menu-button');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    const box = await button.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    await button.click();
    const menu = page.getByRole('dialog');
    await expect(menu).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('link', { name: 'FAQ' })).toBeVisible();
    await expect(page.locator('.menu-close')).toBeFocused();
    // Tab stays inside
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    expect(await menu.evaluate((el) => el.contains(document.activeElement))).toBeTruthy();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
    // A link closes it and goes where it points
    await button.click();
    await menu.getByRole('link', { name: 'FAQ' }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#faq$/);
  });
});

for (const path of ARABIC_ENABLED ? ['/', '/ar'] : ['/']) {
  test(`${path}: what you get is a carousel: arrows, dots, keys, and a dialog per card`, async ({
    page,
    isMobile,
  }) => {
    const rtl = path === '/ar';
    await page.goto(path);
    const region = page.locator('.feature-carousel');
    await expect(region).toHaveAttribute('role', 'region');
    await expect(region).toHaveAttribute('aria-roledescription', /.+/);
    const slides = region.locator('.feature-slide');
    await expect(slides).toHaveCount(7);
    await expect(slides.first()).toHaveAttribute('aria-label', rtl ? '1 من 7' : '1 of 7');
    await expect(slides.last()).toHaveAttribute('aria-label', rtl ? '7 من 7' : '7 of 7');
    await region.scrollIntoViewIfNeeded();

    // Three a view on a computer, one and a half on a phone
    // How many cards fit from the first card's edge to the end of the row
    const shown = await region.evaluate((el, rtl) => {
      const track = el.querySelector('.feature-track')!;
      const style = getComputedStyle(track);
      const start = parseFloat(rtl ? style.paddingRight : style.paddingLeft);
      const gap = parseFloat(style.columnGap);
      const card = el.querySelector('.feature-slide')!.getBoundingClientRect().width;
      return (track.getBoundingClientRect().width - start + gap) / (card + gap);
    }, rtl);
    if (isMobile) expect(shown).toBeGreaterThan(1.4);
    else expect(shown).toBeGreaterThan(2.95);
    if (isMobile) expect(shown).toBeLessThan(1.65);
    else expect(shown).toBeLessThan(3.3);

    // The arrows: back is off at the start, next moves the row on
    const back = region.locator('.carousel-arrow').first();
    const next = region.locator('.carousel-arrow').last();
    await expect(back).toBeDisabled();
    const scroll = () => region.locator('.feature-track').evaluate((el) => Math.abs(el.scrollLeft));
    await next.click();
    await expect.poll(scroll).toBeGreaterThan(50);
    await expect(back).toBeEnabled();

    // The dots on a computer: the chosen one is marked, a click goes there
    if (!isMobile) {
      const dots = region.locator('.carousel-dots[data-large] button');
      await expect(dots).toHaveCount(7);
      await dots.nth(0).click();
      await expect.poll(scroll).toBeLessThan(5);
      await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
    }

    // The keys: the arrow towards the end goes to the next card (left in Arabic)
    const cards = region.locator('.feature-card-hit');
    await cards.first().focus();
    await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
    await expect(cards.nth(1)).toBeFocused();

    // Enter opens it in a dialog: three facts, Pre-register; Esc gives focus back
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.screen-dialog-facts li')).toHaveCount(3);
    await expect(dialog.locator('a.btn-primary')).toHaveAttribute('href', '#pre-register');
    await expect(dialog.locator('img')).toHaveAttribute('alt', /.+/);
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBeTruthy();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(cards.nth(1)).toBeFocused();
  });
}

test('the carousel: a mouse can drag it, and the drag does not open a card', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'fingers scroll it natively');
  await page.goto('/');
  const track = page.locator('.feature-track');
  await track.scrollIntoViewIfNeeded();
  const box = (await track.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.7, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.4, y, { steps: 8 });
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100);
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('coming soon stays on what is not released, and every card has a photo', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.feature-card');
  await expect(cards.locator('.feature-photo img')).toHaveCount(7);
  await expect(cards.filter({ hasText: 'Coming soon' })).toHaveCount(3);
  await expect(cards.filter({ hasText: 'Coach assistant' }).locator('img')).toHaveAttribute(
    'alt',
    /portrait/,
  );
});

test('the running line draws down with the scroll, and its nodes fill as you reach them', async ({
  page,
}) => {
  test.slow();
  await page.goto('/', { waitUntil: 'networkidle' });
  const line = page.locator('[data-run-line]');
  await expect(line).toHaveAttribute('aria-hidden', 'true');
  await wake(page);
  await expect(line).toHaveAttribute('data-live', '');
  const state = () =>
    line.evaluate((el) => ({
      drawn: 1 - parseFloat(getComputedStyle(el.querySelector('.run-fill')!).strokeDashoffset),
      on: el.querySelectorAll('.run-on').length,
      nodes: el.querySelectorAll('.run-node').length,
    }));
  await scrollToShare(page, 0.15);
  const early = await state();
  await scrollToShare(page, 0.7);
  const later = await state();
  expect(later.drawn).toBeGreaterThan(early.drawn);
  expect(later.on).toBeGreaterThan(early.on);
  await scrollToShare(page, 1);
  const end = await state();
  expect(end.drawn).toBeGreaterThan(0.99);
  expect(end.on).toBe(end.nodes);
  expect(end.nodes).toBe(7);
  // Out of the content: left of the panels (right of them in Arabic)
  const gap = await page.evaluate(() => {
    const run = document.querySelector('[data-run-line]')!.getBoundingClientRect();
    const panel = document.querySelector('.walk-content .panel')!.getBoundingClientRect();
    return panel.left - run.right;
  });
  expect(gap).toBeGreaterThanOrEqual(0);
});

test('the running line: a still line with every node filled under reduced motion', async ({
  browser,
}) => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto('/');
  const line = page.locator('[data-run-line]');
  await expect(line.locator('.run-node')).toHaveCount(7);
  expect(await line.evaluate((el) => el.hasAttribute('data-live'))).toBeFalsy();
  const offset = await line
    .locator('.run-fill')
    .evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset));
  expect(offset).toBe(0);
  await page.close();
});

test('the end of the page: the walk dims, the pitch is drawn, the footer is up and readable', async ({
  page,
}) => {
  test.slow();
  await page.goto('/', { waitUntil: 'networkidle' });
  await wake(page);
  const dim = () =>
    page.locator('[data-walk-dim]').evaluate((el) => Number(getComputedStyle(el).opacity));
  await scrollToShare(page, 0.5);
  expect(await dim()).toBe(0);
  // Walk down to the end, as a person does, so the footer comes in on the way
  for (const share of [0.8, 0.9, 0.95, 1]) await scrollToShare(page, share);
  await page.waitForTimeout(1500);
  // Smooth scrolling settles into the last pixels: brightness 0.45 at the very end
  await expect.poll(dim).toBeGreaterThan(0.545);
  expect(await dim()).toBeLessThanOrEqual(0.55);
  const footer = page.locator('footer');
  const parts = await footer
    .locator('[data-rise]')
    .evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).opacity)));
  expect(parts.every((o) => o === 1)).toBeTruthy();
  const lines = await footer
    .locator('[data-draw]')
    .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).strokeDashoffset) || 0));
  expect(lines.every((o) => Math.abs(o) < 0.5)).toBeTruthy();
  await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Terms' })).toBeVisible();
  await expect(footer.locator('#contact-footer')).toBeVisible();
  await expect(footer.locator('[hreflang="ar"]')).toBeVisible();
});

test('the end of the page under reduced motion: already drawn, nothing waiting', async ({
  browser,
}) => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  const footer = page.locator('footer');
  await expect(footer.locator('[data-rise]').first()).toBeVisible();
  const styled = await footer
    .locator('[data-rise], [data-draw]')
    .evaluateAll((els) => els.filter((el) => el.getAttribute('style')).length);
  expect(styled).toBe(0);
  await expect(page.locator('[data-walk-dim]')).toBeHidden();
  await page.close();
});

test('the scroll cue is there at the top and gone after the first scroll', async ({ page }) => {
  await page.goto('/');
  const cue = page.locator('.scroll-cue');
  await expect(cue).toBeVisible();
  await page.mouse.wheel(0, 400);
  await expect(cue).toBeHidden();
});

test('inside the app: the tab bar on screens that have one, with the right tab chosen', async ({
  page,
}) => {
  await page.goto('/');
  const coach = page.locator('#view-coach');
  await expect(coach.locator('.app-tabs')).toHaveCount(1);
  await expect(coach.locator('.app-tab')).toHaveCount(5);
  await expect(coach.locator('.app-tab[data-on]')).toHaveText('Calendar');
  const player = page.locator('#view-player');
  await expect(player.locator('.app-tab')).toHaveCount(4);
  await expect(player.locator('.app-tab[data-on]')).toHaveText('Home');
  // A dynamic island and side keys on every phone
  const phones = await page.locator('.showcase-view .phone').count();
  await expect(page.locator('.showcase-view .phone-island')).toHaveCount(phones);
  await expect(page.locator('.showcase-view .phone-keys')).toHaveCount(phones);
});

test('the player card: a raised position badge that moves more than the card', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'the tilt follows a mouse');
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'Player view' }).click();
  const card = page.locator('.card-tilt');
  await card.scrollIntoViewIfNeeded();
  const badge = card.locator('.player-card-badge');
  await expect(badge).toHaveText('M');
  expect(await badge.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe('none');
  await page.mouse.move(10, 10);
  await page.waitForTimeout(800);
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.9, { steps: 10 });
  await expect
    .poll(() => badge.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41))
    .toBeGreaterThan(3);
});
