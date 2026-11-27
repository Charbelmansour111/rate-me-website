import { expect, test } from '@playwright/test';

import { ARABIC_ENABLED } from '../../src/config/site';

/**
 * The first visit's wait for the walk (WEBSITE 24, src/motion/walk-gate.ts): these tests open the
 * page as a first visit, with nothing noted and nothing cached.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const gate = (page: import('@playwright/test').Page) => page.locator('[data-walk-wait]');
const state = (page: import('@playwright/test').Page) =>
  page.locator('html').getAttribute('data-walk-gate');

test('a first visit: the page is there at once, a short wait holds it still, then it opens', async ({
  page,
  isMobile,
}) => {
  test.slow();
  // A little slower than a local server, so the wait lasts long enough to look at
  await page.route('**/journey/**', async (route) => {
    await new Promise((done) => setTimeout(done, 40));
    await route.continue();
  });
  await page.goto('/');
  // The page's content is in the first paint, gate or not
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-walk-gate', 'open');
  await expect(gate(page)).toBeVisible();
  const bar = page.getByRole('progressbar', { name: 'Loading the walk' });
  await expect(bar).toBeVisible();
  await expect(gate(page)).toContainText('Setting up the walk to the pitch');
  // Held still while it is open: a wheel or the space bar moves nothing
  if (!isMobile) {
    await page.mouse.move(600, 300);
    await page.mouse.wheel(0, 600);
  }
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(300);
  if ((await state(page)) === 'open') expect(await page.evaluate(() => scrollY)).toBe(0);
  // It opens once the set is held and the frames round the top are in, and says how long it took
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
  // A return visit: no gate
  await page.reload();
  await expect.poll(() => state(page)).toBe('none');
  await expect(gate(page)).toBeHidden();
});

test('the gate can be skipped at once, and the focus goes to the page', async ({ page }) => {
  // Slow frames, so the gate stays open long enough to skip
  await page.route('**/journey/**', async (route) => {
    await new Promise((done) => setTimeout(done, 400));
    await route.continue();
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-walk-gate', 'open');
  const skip = page.getByRole('button', { name: 'Skip the wait' });
  await skip.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-walk-gate', 'skipped');
  await expect(gate(page)).toBeHidden();
  await expect(page.locator('#main')).toBeFocused();
  await page.evaluate(() => scrollBy({ top: 400, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
});

test('in Arabic, the gate speaks Arabic', async ({ page }) => {
  test.skip(!ARABIC_ENABLED, 'Arabic is off');
  await page.route('**/journey/**', async (route) => {
    await new Promise((done) => setTimeout(done, 400));
    await route.continue();
  });
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('data-walk-gate', 'open');
  await expect(gate(page)).toContainText('نجهّز الطريق إلى الملعب');
  await expect(page.getByRole('progressbar', { name: 'تحميل الطريق' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'تخطَّ الانتظار' })).toBeVisible();
});

test('no gate under reduced motion, or to save data', async ({ browser }) => {
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
