import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { ARABIC_ENABLED } from '../../src/config/site';

const ENGLISH = ['/', '/privacy', '/terms'];
const ARABIC = ['/ar', '/ar/privacy', '/ar/terms'];
/** The suite passes in both states of the flag and checks the state it finds. */
const PAGES = ARABIC_ENABLED ? [...ENGLISH, ...ARABIC] : ENGLISH;

for (const path of PAGES) {
  for (const theme of ['dark', 'light']) {
    test(`${path} (${theme}) has no accessibility violations`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      await page.goto(path);
      for (const summary of await page.locator('summary').all()) await summary.click();
      if (!path.match(/privacy|terms/)) {
        await page.locator('#pre-register .btn-primary:visible').click();
      }
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual(
        [],
      );
    });
  }

  test(`${path} has its metadata and does not scroll sideways`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    await page.goto(path);
    const url = `https://getrateme.space${path === '/' ? '' : path}`;
    const english = path.replace(/^\/ar/, '');
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', url);
    if (!ARABIC_ENABLED) await expect(page.locator('link[hreflang]')).toHaveCount(0);
    for (const [lang, suffix] of !ARABIC_ENABLED
      ? []
      : [
          ['en', english === '/' ? '' : english],
          ['ar', `/ar${english === '/' ? '' : english}`],
          ['x-default', english === '/' ? '' : english],
        ]) {
      await expect(page.locator(`link[hreflang="${lang}"]`)).toHaveAttribute(
        'href',
        `https://getrateme.space${suffix}`,
      );
    }
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /^https:\/\/getrateme\.space\/og\/og-(en|ar)\.png$/,
    );
    await expect(page.locator('h1')).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test('the language switch keeps the page', async ({ page }) => {
  test.skip(!ARABIC_ENABLED);
  await page.goto('/privacy');
  await expect(page.locator('footer').getByRole('link', { name: 'عربي' })).toBeVisible();
  await page.locator('header').getByRole('link', { name: 'عربي' }).click();
  await expect(page).toHaveURL(/\/ar\/privacy$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
});

test('with Arabic off there is no switch and /ar is a 404', async ({ page }) => {
  test.skip(ARABIC_ENABLED);
  await page.goto('/');
  await expect(page.locator('[hreflang=ar]')).toHaveCount(0);
  for (const path of ARABIC) {
    expect((await page.goto(path))?.status(), path).toBe(404);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  }
});

test('an Arabic browser still gets English at "/", without cookies', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'ar-LB' });
  const page = await context.newPage();
  await page.goto('/');
  expect(new URL(page.url()).pathname).toBe('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  if (ARABIC_ENABLED) await page.goto('/ar');
  expect(await context.cookies()).toEqual([]);
  await context.close();
});

test('the nav underlines the section being read', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the section links are hidden on phones');
  await page.goto('/#faq');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.locator('[aria-current]')).toHaveText('FAQ');
});

test('light is the default, and the theme choice is remembered', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');

  await page.getByRole('button', { name: 'Use the dark theme' }).click();
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(11, 11, 12)');
  for (const meta of await page.locator('meta[name=theme-color]').all()) {
    await expect(meta).toHaveAttribute('content', '#0b0b0c');
  }
});

test('follows the system preference until the visitor chooses', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Use the dark theme' }).click();
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('community: room for four coach photos, and a match request that says what it is', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.locator('#community');
  const photos = section.locator('.coach-photo');
  await expect(photos).toHaveCount(4);
  for (const photo of await photos.all()) {
    const box = (await photo.boundingBox())!;
    expect(box.width).toBeCloseTo(box.height, 0);
    await expect(photo).toHaveCSS('border-radius', '50%');
  }
  // Placeholders say nothing to screen readers; real photos come in black and white
  await expect(section.locator('.coach-photo [data-placeholder]')).toHaveCount(
    4 - (await section.locator('.coach-photo img').count()),
  );
  for (const img of await section.locator('.coach-photo img').all()) {
    await expect(img).toHaveCSS('filter', /grayscale\(1\)/);
  }
  const card = section.locator('.match-card');
  await expect(card).toContainText('Match request');
  await expect(card).toContainText('Cedars FC');
  await expect(card).toContainText('Pinewood Academy');
  await expect(card.locator('.status-chip')).toHaveText('Request sent');
  await expect(card).toContainText('Coming soon');
});

test('the main button leads to the form', async ({ page }) => {
  await page.goto('/');
  await page.locator('main').getByRole('link', { name: 'Pre-register' }).first().click();
  await expect(page.getByRole('heading', { name: 'Pre-register', level: 2 })).toBeInViewport();
});

test('unknown addresses get a 404 in the right language', async ({ page }) => {
  expect((await page.goto('/nope'))?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  if (!ARABIC_ENABLED) return;
  expect((await page.goto('/ar/nope'))?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('تسلّل');
});

test('robots, sitemap, redirects and share images work', async ({ request }) => {
  expect(await (await request.get('/robots.txt')).text()).toContain(
    'Sitemap: https://getrateme.space/sitemap.xml',
  );
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const path of PAGES) {
    expect(sitemap).toContain(`<loc>https://getrateme.space${path}</loc>`);
  }
  if (!ARABIC_ENABLED) expect(sitemap).not.toContain('/ar');
  expect((await request.get('/en/privacy')).url()).toMatch(/[0-9]\/privacy$/);
  for (const file of ['/og/og-en.png', '/og/og-ar.png', '/favicon.ico', '/icon-512.png']) {
    expect((await request.get(file)).ok()).toBe(true);
  }
});

test('no API keys reach the browser', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', async (response) => {
    if (response.url().endsWith('.js')) scripts.push(await response.text().catch(() => ''));
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(scripts.length).toBeGreaterThan(0);
  expect(scripts.join('')).not.toMatch(/BREVO|MAILERLITE|api\.brevo\.com|TURNSTILE_SECRET/);
});
