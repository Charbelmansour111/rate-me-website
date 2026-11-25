// Renders the Open Graph images and the favicon set from the brand SVGs.
// Run after changing the logo or the headline: npm run brand
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const icon = await readFile('public/brand/icon.svg', 'utf8');
const wordmark = await readFile('public/brand/wordmark-on-light.svg', 'utf8');

// Colors come from the light theme, the first block of the palette.
const palette = await readFile('src/app/palette.css', 'utf8');
const color = (name) => palette.match(new RegExp(`--${name}: (#[0-9a-f]{6})`))[1];
const SOFT = color('soft');
const TEXT = color('text');
const CHALK = color('chalk');
const ORANGE = color('brand-orange');

const COPY = {
  en: {
    dir: 'ltr',
    lines: ['A home for', 'football', 'coaches'],
    size: 156,
    height: 0.9,
    cta: 'Pre-register',
  },
  ar: {
    dir: 'rtl',
    lines: ['بيت مدرّبي', 'كرة', 'القدم'],
    size: 118,
    height: 1.3,
    cta: 'سجّل مسبقًا',
  },
};
const FONTS =
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@600&family=Readex+Pro:wght@600;700&display=block';

const browser = await chromium.launch();
await mkdir('public/og', { recursive: true });

for (const [locale, { dir, lines, size, height, cta }] of Object.entries(COPY)) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(
    `<html dir="${dir}"><head><link rel="stylesheet" href="${FONTS}"></head>
    <body style="margin:0;width:1200px;height:630px;overflow:hidden;position:relative;background:${SOFT};color:${TEXT}">
      <svg style="position:absolute;inset:0" width="1200" height="630" fill="none" stroke="${CHALK}" stroke-width="4">
        <circle cx="${dir === 'rtl' ? 60 : 1140}" cy="200" r="170"/><path stroke="${ORANGE}" d="M${dir === 'rtl' ? 60 : 1140} 0V630"/>
        <path d="M24 24H1176V606H24Z"/>
      </svg>
      <div style="position:absolute;inset:72px 84px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start">
        <div style="width:100%;display:flex;justify-content:space-between;align-items:center">
          <div style="width:320px">${wordmark}</div>
          <div style="background:${ORANGE};color:${TEXT};border-radius:999px;padding:14px 40px;font:600 34px/1.4 Barlow,'Readex Pro'">${cta}</div>
        </div>
        <div style="font:${locale === 'ar' ? 700 : 400} ${size}px/${height} 'Bebas Neue','Readex Pro'">${lines[0]}<br>${lines[1]} <span style="color:${ORANGE};display:inline-block;border-bottom:10px solid ${ORANGE};padding-bottom:${dir === 'rtl' ? 22 : 6}px">${lines[2]}</span></div>
      </div>
    </body></html>`,
    { waitUntil: 'networkidle' },
  );
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.screenshot({ path: `public/og/og-${locale}.png` });
  await page.close();
}

async function renderIcon(size, radius = 0) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<body style="margin:0"><img width="${size}" height="${size}" style="display:block;border-radius:${radius}px" src="data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}"></body>`,
  );
  await page.waitForFunction(() => document.querySelector('img').complete);
  // Rounded corners keep the PNG in RGBA, which the ICO decoder needs.
  const png = await page.screenshot({ omitBackground: true });
  await page.close();
  return png;
}

await writeFile('src/app/icon.svg', icon);
await writeFile('src/app/apple-icon.png', await renderIcon(180));
await writeFile('public/icon-192.png', await renderIcon(192));
await writeFile('public/icon-512.png', await renderIcon(512));

// favicon.ico: one 32px PNG in an ICO container.
const png = await renderIcon(32, 6);
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(1, 4); // one image
header.writeUInt8(32, 6);
header.writeUInt8(32, 7);
header.writeUInt16LE(1, 10); // planes
header.writeUInt16LE(32, 12); // bits per pixel
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18); // offset
await writeFile('src/app/favicon.ico', Buffer.concat([header, png]));

await browser.close();
