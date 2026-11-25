import { afterEach, describe, expect, it, vi } from 'vitest';

/** Loads the site with the flag in a given state, whatever it is set to today. */
async function load(enabled: boolean) {
  vi.resetModules();
  vi.doMock('../../src/config/site', async (original) => ({
    ...(await original<object>()),
    ARABIC_ENABLED: enabled,
  }));
  const { LOCALES } = await import('@/i18n');
  const { pageMetadata, structuredData } = await import('@/lib/seo');
  const { default: sitemap } = await import('@/app/sitemap');
  const { LanguageSwitch } = await import('@/components/language-switch');
  const { default: config } = await import('../../next.config');
  const rewrites = (await config.rewrites!()) as { beforeFiles: { source: string }[] };
  return {
    LOCALES,
    metadata: pageMetadata('en', '/privacy'),
    graph: JSON.stringify(structuredData('en')),
    sitemap: sitemap(),
    languageSwitch: LanguageSwitch({ locale: 'en', path: '/' }),
    blocked: rewrites.beforeFiles.map((rule) => rule.source),
  };
}

afterEach(() => vi.doUnmock('../../src/config/site'));

describe('ARABIC_ENABLED', () => {
  it('true: Arabic is in the switch, hreflang, sitemap and routes', async () => {
    const on = await load(true);
    expect(on.LOCALES).toEqual(['en', 'ar']);
    expect(on.languageSwitch).not.toBeNull();
    expect(on.metadata.alternates?.languages).toEqual({
      en: 'https://getrateme.space/privacy',
      ar: 'https://getrateme.space/ar/privacy',
      'x-default': 'https://getrateme.space/privacy',
    });
    expect(on.sitemap).toHaveLength(6);
    expect(on.graph).toContain('"inLanguage":["en","ar"]');
    expect(on.blocked).toEqual([]);
  });

  it('false: no trace of Arabic, and /ar is blocked', async () => {
    const off = await load(false);
    expect(off.LOCALES).toEqual(['en']);
    expect(off.languageSwitch).toBeNull();
    expect(off.metadata.alternates?.languages).toBeUndefined();
    expect(off.sitemap.map((page) => page.url)).toEqual([
      'https://getrateme.space/',
      'https://getrateme.space/privacy',
      'https://getrateme.space/terms',
    ]);
    expect(JSON.stringify([off.sitemap, off.metadata])).not.toMatch(/\/ar\b|ar_LB/);
    expect(off.graph).toContain('"inLanguage":["en"]');
    expect(off.blocked).toEqual(['/ar', '/ar/:path*']);
  });
});
