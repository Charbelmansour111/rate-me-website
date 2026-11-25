import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/privacy', '/terms', '/ar', '/ar/privacy', '/ar/terms'];

for (const path of PAGES) {
  for (const theme of ['dark', 'light']) {
    test(`${path} (${theme}) has no accessibility violations`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
      await page.goto(path);
      for (const summary of await page.locator('summary').all()) await summary.click();
      if (!path.match(/privacy|terms/)) await page.locator('#pre-register [type=submit]').click();
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
    for (const [lang, suffix] of [
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
  await page.goto('/privacy');
  await page.getByRole('link', { name: 'عربي' }).click();
  await expect(page).toHaveURL(/\/ar\/privacy$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
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

test('the main button leads to the form', async ({ page }) => {
  await page.goto('/');
  await page.locator('main').getByRole('link', { name: 'Pre-register' }).first().click();
  await expect(page.getByRole('heading', { name: 'Pre-register', level: 2 })).toBeInViewport();
});

test('unknown addresses get a 404 in the right language', async ({ page }) => {
  expect((await page.goto('/nope'))?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect((await page.goto('/ar/nope'))?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('تسلّل');
});

test('robots, sitemap, redirects and share images work', async ({ request }) => {
  expect(await (await request.get('/robots.txt')).text()).toContain(
    'Sitemap: https://getrateme.space/sitemap.xml',
  );
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const path of ['/ar', '/privacy', '/ar/terms']) {
    expect(sitemap).toContain(`<loc>https://getrateme.space${path}</loc>`);
  }
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
