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
    // Four whole cards a view on a computer (1280 wide here), one and a half on a phone
    if (isMobile) expect(shown).toBeGreaterThan(1.4);
    else expect(shown).toBeGreaterThan(3.9);
    if (isMobile) expect(shown).toBeLessThan(1.65);
    else expect(shown).toBeLessThan(4.1);

    // The arrows: back is off at the start, next moves the row on
    const back = region.locator('.carousel-arrow').first();
    const next = region.locator('.carousel-arrow').last();
    // At the start the back arrow says it does nothing (dimmed, still in the Tab order)
    await expect(back).toHaveAttribute('aria-disabled', 'true');
    const scroll = () => region.locator('.feature-track').evaluate((el) => Math.abs(el.scrollLeft));
    await next.click();
    await expect.poll(scroll).toBeGreaterThan(50);
    await expect(back).toHaveAttribute('aria-disabled', 'false');

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
  // Match requests are released: two left (tournaments, the assistant)
  await expect(cards.filter({ hasText: 'Coming soon' })).toHaveCount(2);
  await expect(cards.filter({ hasText: 'Match requests' })).not.toContainText('Coming soon');
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
  // The coach view shows the app's own clean screens (WEBSITE 18): their tab bar is in the
  // picture, so none is drawn over them
  const coach = page.locator('#view-coach');
  await expect(coach.locator('.app-tabs')).toHaveCount(0);
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
  await expect(card.locator('.shield-card')).toHaveCount(1);
  await card.scrollIntoViewIfNeeded();
  // The overall and position stand off the card: a shadow, and more parallax than the card
  const badge = card.locator('.shield-badge');
  await expect(badge.locator('.shield-overall')).toHaveText('72');
  expect(await badge.evaluate((el) => getComputedStyle(el).textShadow)).not.toBe('none');
  await page.mouse.move(10, 10);
  await page.waitForTimeout(800);
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.9, { steps: 10 });
  await expect
    .poll(() => badge.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41))
    .toBeGreaterThan(3);
});

test.describe('WEBSITE 15: sizes that fit the screen', () => {
  test.skip(({ isMobile }) => isMobile, 'screen sizes of a computer');
  for (const [width, height] of [
    [1440, 900],
    [1280, 720],
  ] as const) {
    test(`at ${width}x${height}: What you get fits one screen; three phones fit, none taller than 72vh`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      // The whole section (heading, four cards, controls) under the 72px header
      const features = await page.locator('#features .panel').boundingBox();
      expect(features!.height).toBeLessThanOrEqual(height - 72);
      // Four whole cards
      const whole = await page.locator('.feature-track').evaluate((track) => {
        const edge = track.getBoundingClientRect();
        return [...track.children].filter((slide) => {
          const box = slide.getBoundingClientRect();
          return box.left >= edge.left - 1 && box.right <= edge.right + 1;
        }).length;
      });
      expect(whole).toBe(4);
      // Inside the app: three phones side by side, inside the panel, each under 72% of the screen
      const phones = page.locator('#view-coach .phone');
      await expect(phones).toHaveCount(3);
      const panel = (await page.locator('#inside .panel').boundingBox())!;
      for (const phone of await phones.all()) {
        const box = (await phone.boundingBox())!;
        expect(box.height).toBeLessThanOrEqual(height * 0.72);
        expect(box.x).toBeGreaterThanOrEqual(panel.x);
        expect(box.x + box.width).toBeLessThanOrEqual(panel.x + panel.width);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    });
  }
});

for (const path of ARABIC_ENABLED ? ['/', '/ar'] : ['/']) {
  test(`${path}: the carousel's end: next dimmed, every dot full, 7 of 7; and back at the start`, async ({
    page,
  }) => {
    const rtl = path === '/ar';
    await page.goto(path);
    const region = page.locator('.feature-carousel');
    await region.scrollIntoViewIfNeeded();
    const [back, next] = [
      region.locator('.carousel-arrow').first(),
      region.locator('.carousel-arrow').last(),
    ];
    const count = region.locator('[data-count]');
    // To the end, with the next arrow
    for (let i = 0; i < 8; i++) {
      if ((await next.getAttribute('aria-disabled')) === 'true') break;
      await next.dispatchEvent('click');
      await page.waitForTimeout(450);
    }
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(count).toHaveText(rtl ? '7 من 7' : '7 of 7');
    await expect(region.locator('.carousel-dots:visible [data-on]')).toHaveCount(7);
    // The last card stops at the end of the row: nothing of the row past it
    const gap = await region.locator('.feature-track').evaluate((track) => {
      const last = track.lastElementChild!.getBoundingClientRect();
      const edge = track.getBoundingClientRect();
      return document.dir === 'rtl' ? last.left - edge.left : edge.right - last.right;
    });
    expect(gap).toBeLessThan(80);
    // A dimmed arrow does nothing, and stays reachable (Playwright will not click it: dispatch)
    await expect(next).toBeVisible();
    await next.dispatchEvent('click');
    await expect(count).toHaveText(rtl ? '7 من 7' : '7 of 7');
    // Back to the start: the back arrow is the dimmed one
    for (let i = 0; i < 8; i++) {
      if ((await back.getAttribute('aria-disabled')) === 'true') break;
      await back.dispatchEvent('click');
      await page.waitForTimeout(450);
    }
    await expect(back).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveAttribute('aria-disabled', 'false');
  });
}

test('the tactics paint: behind solid ground, drawn in, still under reduced motion', async ({
  browser,
}) => {
  const page = await browser.newPage();
  await page.goto('/', { waitUntil: 'networkidle' });
  const svg = page.locator('[data-brush]');
  await expect(svg).toHaveAttribute('aria-hidden', 'true');
  await expect(svg.locator('[data-brush-stroke]')).not.toHaveCount(0);
  // No filter or blur anywhere in it
  expect(await svg.evaluate((el) => el.querySelectorAll('filter, [filter]').length)).toBe(0);
  // The words and the board stand on the panel's own solid colour, in front of the paint
  const grounds = await page.evaluate(() => {
    const panel = getComputedStyle(document.querySelector('.tactics-pin .panel')!).backgroundColor;
    return ['.tactics-copy', '.tactics-board'].map((s) => [
      getComputedStyle(document.querySelector(s)!).backgroundColor,
      panel,
    ]);
  });
  for (const [ground, panel] of grounds) expect(ground).toBe(panel);
  // With motion: rolled on as the section comes in
  await page.mouse.move(300, 300);
  await page.mouse.move(320, 320);
  // The motion code loads in a quiet moment after the first sign of use: give a busy machine time
  await expect(page.locator('html')).toHaveAttribute('data-stages', 'live', { timeout: 15_000 });
  await page.locator('#tactics').evaluate((el) => el.scrollIntoView());
  const offsets = () =>
    svg
      .locator('[data-brush-stroke]')
      .evaluateAll((els) =>
        els.map((el) => parseFloat(getComputedStyle(el).strokeDashoffset) || 0),
      );
  await expect.poll(async () => Math.max(...(await offsets()))).toBeLessThan(0.01);
  await page.close();
  // Reduced motion: already painted, nothing moves
  const calm = await browser.newPage({ reducedMotion: 'reduce' });
  await calm.goto('/');
  const still = await calm
    .locator('[data-brush] [data-brush-stroke]')
    .evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).strokeDashoffset) || 0));
  expect(Math.max(...still)).toBe(0);
  await calm.close();
});
