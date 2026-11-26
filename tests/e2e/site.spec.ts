import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { ARABIC_ENABLED } from '../../src/config/site';

/** On a phone the language and theme are in the menu. */
async function openMenu(page: Page, isMobile: boolean) {
  if (isMobile) await page.locator('.bar-menu-button').click();
}

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
      for (const question of await page.locator('.faq-button').all()) await question.click();
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

test('the language switch keeps the page', async ({ page, isMobile }) => {
  test.skip(!ARABIC_ENABLED);
  await page.goto('/privacy');
  await expect(page.locator('footer').getByRole('link', { name: 'عربي' })).toBeVisible();
  await openMenu(page, isMobile);
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

test('light is the default, and the theme choice is remembered', async ({ page, isMobile }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 252, 247)');

  await openMenu(page, isMobile);
  await page.getByRole('button', { name: 'Use the dark theme' }).click();
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(15, 14, 13)');
  for (const meta of await page.locator('meta[name=theme-color]').all()) {
    await expect(meta).toHaveAttribute('content', '#0f0e0d');
  }
});

test('follows the system preference until the visitor chooses', async ({ page, isMobile }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html).toHaveAttribute('data-theme', 'light');
  await openMenu(page, isMobile);
  await page.getByRole('button', { name: 'Use the dark theme' }).click();
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('community: a strip of stock portraits, and a match request that says what it is', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const section = page.locator('#community');
  const photos = section.locator('.coach-photo');
  await expect(photos).toHaveCount(8);
  // Six in a row on a phone, all eight on a computer
  const shown = section.locator('.coach-photo:visible');
  await expect(shown).toHaveCount(isMobile ? 6 : 8);
  for (const photo of await shown.all()) {
    const box = (await photo.boundingBox())!;
    expect(box.width).toBeCloseTo(box.height, 0);
    await expect(photo).toHaveCSS('border-radius', '50%');
  }
  // Placeholders say nothing to screen readers; real photos come in black and white
  await expect(section.locator('.coach-photo [data-placeholder]')).toHaveCount(
    8 - (await section.locator('.coach-photo img').count()),
  );
  for (const img of await section.locator('.coach-photo img').all()) {
    await expect(img).toHaveCSS('filter', /grayscale\(1\)/);
  }
  // Stock photos: they load, and nothing says who they are (alt="": decorative, no names)
  await expect(section.locator('.coach-photo img')).toHaveCount(8);
  for (const img of await section.locator('.coach-photo:visible img').all()) {
    await expect(img).toHaveAttribute('alt', '');
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  await expect(section).not.toContainText(/founding coach/i);
  const card = section.locator('.match-card');
  await expect(card).toContainText('An example of what is coming');
  await expect(card).toContainText('Match request');
  await expect(card).toContainText('Cedars FC');
  await expect(card).toContainText('Pinewood Academy');
  await expect(card.locator('.status-chip')).toHaveText('Request sent');
  await expect(card).toContainText('Coming soon');
});

test('feature cards: a photo on every card, the same shape, each saying what it shows', async ({
  page,
}) => {
  await page.goto('/');
  const cards = page.locator('#features .feature-card');
  await expect(cards).toHaveCount(7);
  for (let i = 0; i < 7; i++) {
    const art = cards.nth(i).locator('.feature-photo');
    await art.evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
    const img = art.locator('img');
    expect(((await img.getAttribute('alt')) ?? '').length).toBeGreaterThan(15);
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
    const box = (await art.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(4 / 3, 1);
  }
});

for (const [path, title, question] of [
  ['/', 'Monthly player report', 'Do parents see their child’s progress?'],
  ['/ar', 'تقرير شهري للاعب', 'هل يرى الأهل تقدّم أولادهم؟'],
]) {
  test(`${path}: the parents' monthly report has its card and its answer`, async ({ page }) => {
    test.skip(path === '/ar' && !ARABIC_ENABLED);
    await page.goto(path);
    const card = page.locator('#features .feature-card').filter({ hasText: title });
    await expect(card).toHaveCount(1);
    // Released: no Coming soon tag; a photo like the others
    await expect(card).not.toContainText(/Coming soon|قريبًا/);
    await expect(card.locator('.feature-photo img')).toHaveCount(1);
    await expect(card).toContainText('PDF');
    const button = page.locator('#faq').getByRole('button', { name: question });
    await button.click();
    const answer = page.locator(`#${await button.getAttribute('aria-controls')}`);
    await expect(answer).toContainText('PDF');
    // The coach publishes it and the player shares it: parents have no accounts
    await expect(answer).toContainText(
      path === '/' ? 'share it with their parents' : 'مشاركته مع أهله',
    );
    // Says what is in it, promises no date
    await expect(answer).not.toContainText(/\d{4}|(by|from) (january|june|september)/i);
  });
}

test('faq: an accordion of buttons, by mouse and by keyboard', async ({ page }) => {
  await page.goto('/');
  const faq = page.locator('#faq');
  const questions = faq.getByRole('button');
  await expect(questions).toHaveCount(8);
  const first = questions.first();
  const panel = faq.locator('#faq-a-0');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(first).toHaveAttribute('aria-controls', 'faq-a-0');
  await expect(panel.locator('p')).toBeHidden();
  await expect.poll(() => panel.evaluate((el) => el.getBoundingClientRect().height)).toBe(0);

  await first.click();
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expect(panel.locator('p')).toBeVisible();
  await expect
    .poll(() => panel.evaluate((el) => el.getBoundingClientRect().height))
    .toBeGreaterThan(40);
  const item = faq.locator('.faq-item').first();
  // The orange line beside it, and the plus has turned into a minus
  await expect
    .poll(() => item.evaluate((el) => getComputedStyle(el, '::before').transform))
    .toBe('none');
  await expect(item.locator('.faq-icon')).toBeVisible();

  // Arrows, Home and End move between questions; Enter and Space open and close
  await first.focus();
  await page.keyboard.press('ArrowDown');
  await expect(questions.nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(questions.last()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(first).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowUp');
  await expect(questions.last()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(questions.last()).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Space');
  await expect(questions.last()).toHaveAttribute('aria-expanded', 'false');

  // The privacy link inside an answer is reachable once it is open
  const privacy = questions.filter({ hasText: 'data' });
  await privacy.click();
  await expect(faq.getByRole('link', { name: 'Read the privacy policy' })).toBeVisible();
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

for (const [path, yourData, retention, report] of [
  [
    '/privacy',
    'Your data',
    '12 months after the app launches',
    'If their club uses monthly reports',
  ],
  ['/ar/privacy', 'بياناتك', '12 شهرًا بعد إطلاق التطبيق', 'إذا كان النادي يستخدم التقارير الشهرية'],
] as const) {
  test(`${path}: your data, how long it is kept, the parents' report, who to contact`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page.locator('#your-data h2')).toHaveText(yourData);
    await expect(page.locator('#website-retention')).toContainText(retention);
    await expect(page.locator('#minors')).toContainText(report);
    // Every email can be unsubscribed from
    await expect(page.locator('#website-why')).toContainText(/unsubscribe|إلغاء الاشتراك/);
    // Who runs it: on the page and in the footer, each with its own heading
    await expect(page.locator('#contact-page')).toBeVisible();
    await expect(page.locator('#contact-footer')).toBeVisible();
    await expect(page.locator('main dl dd')).toHaveCount(4);
  });
}

test('cookies: no banner and no settings while statistics are off; nothing pre-ticked', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.cookie-banner')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cookie settings' })).toHaveCount(0);
  // The consent box starts empty: the visitor ticks it
  await expect(page.locator('#f-consent')).not.toBeChecked();
});

test('no promises the product cannot back', async ({ page }) => {
  for (const path of ['/', '/ar']) {
    await page.goto(path);
    const text = await page.locator('main').innerText();
    for (const claim of [
      /always free/i,
      /free forever/i,
      /built with coaches/i,
      /used by/i,
      /\bbest\b/i,
      /countdown|days left|spots left/i,
      /FIFA|UEFA|Champions League/i,
    ]) {
      expect(text, `${path} ${claim}`).not.toMatch(claim);
    }
  }
});
