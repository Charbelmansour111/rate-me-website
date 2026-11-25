import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { THEME_COLORS } from '@/config/theme';

const css = readFileSync('src/app/palette.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]),
  );
}

const light = block(':root');
const dark = { ...light, ...block(":root[data-theme='dark']") };
const inverse = block('\n.inverse');
const themes = {
  light,
  dark,
  'black block': { ...light, ...inverse },
  'black block in dark': {
    ...dark,
    ...inverse,
    ...block(":root[data-theme='dark'] section.inverse"),
  },
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (high + 0.05) / (low + 0.05);
}

/** The tint's opacity, and one color laid over another with it. */
const TINT = Number(css.match(/--tint: rgb\(255 90 0 \/ ([\d.]+)\)/)![1]);
function over(top: string, alpha: number, bottom: string) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16);
  const mixed = [1, 3, 5].map((i) =>
    Math.round(channel(top, i) * alpha + channel(bottom, i) * (1 - alpha)),
  );
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

describe.each(Object.entries(themes))('palette: %s', (name, palette) => {
  const surfaces = name.startsWith('black') ? ['page'] : ['page', 'soft', 'softer'];

  it.each(surfaces)('text is AA on %s', (surface) => {
    for (const color of ['text', 'muted', 'accent-text', 'danger']) {
      // The form never sits on a black block.
      if (color === 'danger' && name.startsWith('black')) continue;
      expect(contrast(palette[color], palette[surface]), color).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('small orange text is AA on the tint', () => {
    for (const surface of surfaces.slice(0, 1)) {
      const tinted = over(palette['brand-orange'] ?? light['brand-orange'], TINT, palette[surface]);
      expect(contrast(palette['accent-text'], tinted)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.text, tinted)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('large orange text and icons are 3:1 on the page', () => {
    expect(contrast(light['brand-orange'], palette.page)).toBeGreaterThanOrEqual(3);
  });
  it('buttons are AA, at rest and on hover', () => {
    for (const fill of ['button', 'button-hover']) {
      expect(contrast(palette['on-button'], palette[fill]), fill).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('outlines and focus rings are 3:1', () => {
    for (const surface of surfaces) {
      expect(contrast(palette.edge, palette[surface])).toBeGreaterThanOrEqual(3);
    }
    expect(contrast(light['brand-orange'], palette.page)).toBeGreaterThanOrEqual(3);
  });
});

it('the browser bar matches the pages', () => {
  expect(THEME_COLORS).toEqual({ light: light.page, dark: dark.page });
});
