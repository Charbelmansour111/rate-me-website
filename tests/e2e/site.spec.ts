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

test('community: three stock portraits, and the app’s match request, said to be an example', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.locator('#community');
  const photos = section.locator('.coach-photo');
  // Three at most, on every screen, with a caption that claims nothing about who they are
  await expect(photos).toHaveCount(3);
  const shown = section.locator('.coach-photo:visible');
  await expect(shown).toHaveCount(3);
  await expect(section.locator('figcaption').first()).toHaveText('Photos for illustration');
  for (const photo of await shown.all()) {
    const box = (await photo.boundingBox())!;
    expect(box.width).toBeCloseTo(box.height, 0);
    await expect(photo).toHaveCSS('border-radius', '50%');
  }
  // Placeholders say nothing to screen readers; real photos come in black and white
  await expect(section.locator('.coach-photo [data-placeholder]')).toHaveCount(
    3 - (await section.locator('.coach-photo img').count()),
  );
  for (const img of await section.locator('.coach-photo img').all()) {
    await expect(img).toHaveCSS('filter', /grayscale\(1\)/);
  }
  // Stock photos: they load, and nothing says who they are (alt="": decorative, no names)
  await expect(section.locator('.coach-photo img')).toHaveCount(3);
  for (const img of await section.locator('.coach-photo:visible img').all()) {
    await expect(img).toHaveAttribute('alt', '');
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  await expect(section).not.toContainText(/founding coach/i);
  // The app itself in the site's phone frame (WEBSITE 19): a request received in front, the
  // channel with a request sent behind it; Example under them, nothing coming soon
  const phones = section.locator('.match-phones');
  await expect(phones.locator('.phone')).toHaveCount(2);
  await expect(phones.locator('.match-phone-front img')).toHaveAttribute('alt', /Accept, Counter/);
  await expect(phones.locator('.match-phone-back img')).toHaveAttribute('alt', /Cancel request/);
  await expect(phones.locator('figcaption .match-example')).toHaveText('Example');
  await expect(phones).not.toContainText(/Coming soon/);
  await expect(phones.locator('button, a')).toHaveCount(0);
  // The phone behind never reaches past the column into the words beside it
  const column = (await phones.boundingBox())!;
  const back = (await phones.locator('.match-phone-back').boundingBox())!;
  expect(back.x + back.width).toBeLessThanOrEqual(column.x + column.width + 1);
  // Atmosphere: one photo of players from behind, in colour (no face shows)
  await expect(section.locator('.community-photo')).toHaveAttribute('alt', /from behind/);
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
    expect(box.width / box.height).toBeCloseTo(16 / 10, 1);
  }
});

for (const path of ARABIC_ENABLED ? ['/', '/ar'] : ['/']) {
  test(`${path}: the app's own screens on three cards, whole in their dialogs (WEBSITE 18)`, async ({
    page,
  }) => {
    const ar = path === '/ar';
    await page.goto(path);
    for (const [id, frame, file] of [
      ['squad', 'phone', 'squad-detail'],
      ['parentReport', 'paper', 'parentReport-detail'],
      ['matchRequests', 'phone', 'matchRequests-detail'],
    ] as const) {
      const card = page
        .locator('.feature-card')
        .filter({ has: page.locator(`#feature-${id}-title`) });
      await card.scrollIntoViewIfNeeded();
      const tag = card.locator('.feature-example');
      const face = card.locator('.feature-photo img');
      if (id === 'matchRequests') {
        // A photo on the card (WEBSITE 19: a cropped screen read badly); the app is in the dialog
        await expect(tag).toHaveCount(0);
        await expect(face).toHaveAttribute('src', /matchRequests\.webp/);
      } else {
        // Example is said off the picture, in the card's body, and covers none of it
        await expect(tag).toHaveText(ar ? 'مثال' : 'Example');
        await expect(card.locator('.feature-photo .feature-example')).toHaveCount(0);
        const photo = (await card.locator('.feature-photo').boundingBox())!;
        const box = (await tag.boundingBox())!;
        expect(box.y).toBeGreaterThanOrEqual(photo.y + photo.height);
        // The face has its size set and waits until it is near
        await expect(face).toHaveAttribute('width', /\d+/);
      }
      await expect(face).toHaveAttribute('loading', 'lazy');

      await card.locator('.feature-card-hit').dispatchEvent('click');
      const shot = page.locator('.feature-dialog-shot');
      await expect(shot).toHaveAttribute('data-frame', frame);
      const pages = shot.locator('img');
      await expect(pages.first()).toHaveAttribute('src', new RegExp(file));
      const caption = shot.locator('figcaption');
      await expect(caption.locator('.feature-example')).toHaveText(ar ? 'مثال' : 'Example');
      if (ar) await expect(caption).toContainText('التطبيق معروض بالإنجليزية');
      else await expect(caption).not.toContainText(/English/);
      if (frame === 'paper') {
        // A PDF: two sheets of paper, no phone, and it says so
        await expect(shot.locator('.paper-sheet')).toHaveCount(2);
        await expect(shot.locator('.phone')).toHaveCount(0);
        await expect(caption).toContainText(ar ? 'التقرير الشهري (PDF)' : 'Monthly report (PDF)');
        // The page on top describes both; the one under it adds nothing for screen readers
        await expect(shot.locator('.paper-sheet:not([data-under]) img')).toHaveAttribute(
          'alt',
          /PDF/,
        );
        await expect(shot.locator('.paper-sheet[data-under] img')).toHaveAttribute('alt', '');
      } else {
        // The whole screen in the site's phone frame, its status bar drawn
        await expect(shot.locator('.phone .phone-status')).toContainText('9:41');
        await expect(pages).toHaveCount(1);
        expect(((await pages.getAttribute('alt')) ?? '').length).toBeGreaterThan(30);
        // Not stretched: drawn at the file's own shape
        const img = (await pages.boundingBox())!;
        const ratio =
          Number(await pages.getAttribute('height')) / Number(await pages.getAttribute('width'));
        expect(img.height / img.width).toBeCloseTo(ratio, 1);
      }
      await page.keyboard.press('Escape');
      await expect(shot).toHaveCount(0);
    }
    // Inside the app: the Arabic page says the screens are in English
    const note = page.locator('#inside .showcase-lang');
    if (ar) await expect(note).toHaveText('التطبيق معروض بالإنجليزية');
    else await expect(note).toHaveCount(0);
  });
}

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
