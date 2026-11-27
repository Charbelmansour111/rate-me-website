import { expect, test } from '@playwright/test';

import { ARABIC_ENABLED } from '../../src/config/site';

/**
 * The first visit's intro (WEBSITE 25, src/motion/walk-gate.ts): these tests open the page as a
 * first visit, with nothing noted and nothing cached. The intro's frames come as one file
 * (src/config/walk-pack.ts): held back a little, so the intro stays long enough to look at.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const gate = (page: import('@playwright/test').Page) => page.locator('[data-walk-wait]');
const state = (page: import('@playwright/test').Page) =>
  page.locator('html').getAttribute('data-walk-gate');
const slowPack = (page: import('@playwright/test').Page, ms: number) =>
  page.route('**/journey/pack/**', async (route) => {
    await new Promise((done) => setTimeout(done, ms));
    await route.continue().catch(() => {});
  });

test('a first visit: the intro is there from the first paint, holds the page still, then opens', async ({
  page,
  isMobile,
}) => {
  test.slow();
  await slowPack(page, 1500);
  await page.goto('/', { waitUntil: 'commit' });
  // Decided before the first paint, by the script in the page itself
  await page.waitForSelector('[data-walk-wait]', { state: 'attached' });
  expect(await state(page)).toBe('open');
  await expect(gate(page)).toBeVisible();
  await expect(page.getByRole('img', { name: 'Rate Me' })).toBeVisible();
  const bar = page.getByRole('progressbar', { name: 'Loading the walk' });
  await expect(bar).toBeVisible();
  // The page is under it all along: its heading is laid out, not hidden
  expect(
    await page.getByRole('heading', { level: 1 }).evaluate((h) => getComputedStyle(h).visibility),
  ).toBe('visible');
  // Held still while it is open: a wheel or the space bar moves nothing
  if (!isMobile) {
    await page.mouse.move(600, 300);
    await page.mouse.wheel(0, 600);
  }
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(300);
  if ((await state(page)) === 'open') expect(await page.evaluate(() => scrollY)).toBe(0);
  // It opens once the intro's frames are held and those round the top decoded, and says when
  await expect(page.locator('html')).toHaveAttribute('data-walk-gate', 'done', { timeout: 60_000 });
  await expect(gate(page)).toBeHidden();
  expect(Number(await page.locator('html').getAttribute('data-walk-gate-ms'))).toBeGreaterThan(0);
  // Full when it closed (hidden now, so found by its role attribute, not as a visible progress bar)
  expect(await gate(page).locator('[role="progressbar"]').getAttribute('aria-valuenow')).toBe(
    '100',
  );
  // Then the page scrolls as ever
  if (!isMobile) await page.mouse.wheel(0, 600);
  else await page.evaluate(() => scrollBy({ top: 600, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  // The rest of the set comes in behind; once it is held, a return visit has no intro
  await expect
    .poll(
      () =>
        page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith('walk-held'))),
      { timeout: 60_000 },
    )
    .toBe(true);
  await page.reload({ waitUntil: 'commit' });
  await page.waitForSelector('[data-walk-wait]', { state: 'attached' });
  expect(await state(page)).not.toBe('open');
  await expect(gate(page)).toBeHidden();
  await expect.poll(() => state(page)).toBe('none');
});

test('the intro can be skipped at once, and the focus goes to the page', async ({ page }) => {
  // Frames held back, so the intro stays up long enough to skip
  await slowPack(page, 20_000);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-walk-gate', 'open');
  // The page behind is out of reach: the first Tab lands on Skip
  await expect(page.locator('#main')).toHaveJSProperty('inert', true);
  const skip = page.getByRole('button', { name: 'Skip' });
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-walk-gate', 'skipped');
  await expect(gate(page)).toBeHidden();
  await expect(page.locator('#main')).toBeFocused();
  await page.evaluate(() => scrollBy({ top: 400, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
});

test('in Arabic, the intro speaks Arabic', async ({ page }) => {
  test.skip(!ARABIC_ENABLED, 'Arabic is off');
  await slowPack(page, 20_000);
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('data-walk-gate', 'open');
  await expect(page.getByRole('progressbar', { name: 'تحميل الطريق' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'تخطَّ' })).toBeVisible();
});

test('the intro never outlasts its cap, whatever the connection', async ({ page }) => {
  test.slow();
  await slowPack(page, 60_000);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-walk-gate', 'capped', {
    timeout: 15_000,
  });
  await expect(gate(page)).toBeHidden();
  expect(Number(await page.locator('html').getAttribute('data-walk-gate-ms'))).toBeLessThan(7500);
});

test('no intro under reduced motion, or to save data', async ({ browser }) => {
  const calm = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await calm.newPage();
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await expect(gate(page)).toBeHidden();
  expect(await state(page)).toBeNull();
  await calm.close();

  const saving = await browser.newContext();
  const other = await saving.newPage();
  await other.addInitScript(() =>
    Object.defineProperty(navigator, 'connection', { value: { saveData: true } }),
  );
  await other.goto('/', { waitUntil: 'networkidle' });
  await expect.poll(() => state(other)).toBe('none');
  await expect(gate(other)).toBeHidden();
  await saving.close();
});
