import { expect, test, type Page } from '@playwright/test';

import { ARABIC_ENABLED } from '../../src/config/site';

let ip = 0;
/** Each test gets its own address, so the rate limiter does not mix them up. */
test.beforeEach(async ({ context }, info) => {
  await context.setExtraHTTPHeaders({
    'x-forwarded-for': `10.${info.workerIndex}.${info.retry}.${++ip}`,
  });
});

/** Phones show the form in two steps. */
async function next(page: Page) {
  const button = page.getByRole('button', { name: /^(Next|التالي)$/ });
  if (await button.isVisible()) await button.click();
}
async function fill(page: Page) {
  await page.locator('#f-name').fill('Rami Haddad');
  await page.locator('#f-email').fill('rami@club-beirut.com');
  await page.locator('.role-chip').first().click();
  await next(page);
  await page.locator('#f-phone').fill('03 123 456');
  await page.locator('#f-city').fill('Beirut');
  await page.locator('#f-consent').check();
}
const submit = (page: Page) => page.locator('#pre-register button[type=submit]').click();

test('signs up, then shows the success state with focus on it', async ({ page }) => {
  await page.goto('/');
  await fill(page);
  const request = page.waitForRequest('**/api/pre-register');
  await submit(page);
  expect((await request).postDataJSON()).toMatchObject({
    locale: 'en',
    website: '',
    role: 'coach',
    phone: '+961 3 123 456',
  });
  const heading = page.getByRole('heading', { name: "You're on the list" });
  await expect(heading).toBeFocused();
  await expect(page.getByRole('button', { name: 'Share Rate Me' })).toBeVisible();
});

test('signs up in Arabic', async ({ page }) => {
  test.skip(!ARABIC_ENABLED);
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await fill(page);
  await submit(page);
  await expect(page.getByRole('heading', { name: 'أنت على القائمة' })).toBeVisible();
});

test('shows inline errors, focuses the first one and clears them when fixed', async ({
  page,
  isMobile,
}) => {
  let sent = false;
  page.on('request', (request) => (sent ||= request.url().includes('/api/')));
  await page.goto('/');
  if (isMobile) await next(page);
  else await submit(page);

  await expect(page.locator('#f-name')).toBeFocused();
  await expect(page.locator('#f-name')).toHaveAccessibleDescription(/Enter your name/);
  await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');
  for (const field of ['name', 'email', 'role']) {
    await expect(page.locator(`#e-${field}`)).toBeVisible();
  }
  await page.locator('#f-name').fill('Rami');
  await expect(page.locator('#e-name')).toHaveCount(0);
  await page.locator('#f-email').fill('not an email');
  await page.locator('#f-name').focus();
  await expect(page.locator('#e-email')).toContainText('valid email');

  await page.locator('#f-email').fill('rami@club-beirut.com');
  await page.locator('.role-chip').first().click();
  await expect(page.locator('#e-role')).toHaveCount(0);
  if (isMobile) await next(page);
  await submit(page);
  for (const field of ['city', 'consent']) {
    await expect(page.locator(`#e-${field}`)).toBeVisible();
    await expect(page.locator(`#f-${field}`)).toHaveAttribute('aria-invalid', 'true');
  }
  await expect(page.locator('#f-city')).toBeFocused();
  await expect(page.locator('#e-club')).toHaveCount(0);
  expect(sent).toBe(false);
});

test('the 18+ consent is a small checkbox: labelled, required, with a visible focus ring', async ({
  page,
}) => {
  await page.goto('/');
  // Phones show it on the second step
  await page.locator('#f-name').fill('Rami Haddad');
  await page.locator('#f-email').fill('rami@club-beirut.com');
  await page.locator('.role-chip').first().click();
  await next(page);
  const box = page.getByRole('checkbox', { name: /18 or older/ });
  await expect(box).toHaveAttribute('id', 'f-consent');
  await expect(box).toHaveAttribute('required');
  await expect(box).not.toBeChecked();
  const size = (await box.boundingBox())!;
  expect(Math.round(size.width)).toBe(18);
  expect(Math.round(size.height)).toBe(18);
  // The text is its label: clicking it ticks the box, a second click clears it
  await page.locator('label[for="f-consent"]').click({ position: { x: 4, y: 4 } });
  await expect(box).toBeChecked();
  await expect(box).toHaveCSS('background-color', 'rgb(255, 90, 0)');
  await box.press('Space');
  await expect(box).not.toBeChecked();
  // A keyboard user sees where they are
  await expect(box).toBeFocused();
  await expect(box).toHaveCSS('outline-style', 'solid');
  await expect(box).toHaveCSS('outline-width', '3px');
});

test('phones get two steps, and can go back', async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto('/');
  await expect(page.locator('#f-city')).toBeHidden();
  await page.locator('#f-name').fill('Rami Haddad');
  await page.locator('#f-email').fill('rami@club-beirut.com');
  await page.getByText('Academy owner', { exact: true }).click();
  // Enter means "next" here
  await page.locator('#f-email').press('Enter');
  await expect(page.getByRole('heading', { name: /Step 2 of 2/ })).toBeFocused();
  await expect(page.locator('#f-name')).toBeHidden();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.locator('#f-name')).toHaveValue('Rami Haddad');
});

test('roles are chips and cities can be picked', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('radio')).toHaveCount(4);
  await expect(page.getByRole('radio', { name: /Player|Parent/ })).toHaveCount(0);
  await page.getByRole('radio', { name: 'Coach', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Academy owner' })).toBeChecked();
  await page.locator('#f-name').fill('Rami Haddad');
  await page.locator('#f-email').fill('rami@club-beirut.com');
  await next(page);
  await page.getByRole('button', { name: 'Tripoli' }).click();
  await expect(page.locator('#f-city')).toHaveValue('Tripoli');
  await expect(page.getByRole('button', { name: 'Tripoli' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('shows the server’s own errors', async ({ page, isMobile }) => {
  await page.goto('/');
  await fill(page);
  if (isMobile) await page.getByRole('button', { name: 'Back' }).click();
  await page.locator('#f-email').fill('rami@mailinator.com');
  if (isMobile) await next(page);
  await submit(page);
  await expect(page.locator('#e-email')).toContainText('Temporary addresses');
  await expect(page.locator('#f-email')).toBeFocused();
});

test('keeps what was typed when the service is down', async ({ page }) => {
  await page.route('**/api/pre-register', (route) =>
    route.fulfill({ status: 503, json: { ok: false, error: 'unavailable' } }),
  );
  await page.goto('/');
  await fill(page);
  await submit(page);
  await expect(page.getByRole('alert').filter({ hasText: 'could not save' })).toBeVisible();
  await expect(page.locator('#f-name')).toHaveValue('Rami Haddad');
});

test('the honeypot is out of reach for people, and a bot gets a plain success', async ({
  page,
}) => {
  await page.goto('/');
  const trap = page.locator('#f-website');
  await expect(trap).not.toBeInViewport();
  await expect(trap).toHaveAttribute('tabindex', '-1');
  await fill(page);
  await trap.evaluate((input: HTMLInputElement) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'x');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const request = page.waitForRequest('**/api/pre-register');
  await submit(page);
  expect((await request).postDataJSON().website).toBe('x');
  await expect(page.getByRole('heading', { name: "You're on the list" })).toBeVisible();
});

test('slows down after ten tries', async ({ request }) => {
  // This fixture has its own headers: a fresh address for every run.
  const headers = { 'x-forwarded-for': `limit-${Date.now()}-${Math.random()}` };
  const post = () => request.post('/api/pre-register', { data: {}, headers });
  for (let i = 0; i < 10; i++) expect((await post()).status()).toBe(422);
  const blocked = await post();
  expect(blocked.status()).toBe(429);
  expect(Number(blocked.headers()['retry-after'])).toBeGreaterThan(0);
});
