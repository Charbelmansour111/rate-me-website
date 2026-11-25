import type { MetadataRoute } from 'next';

import { LOCALES, type PagePath } from '@/i18n';
import { absolute } from '@/lib/seo';

const PAGES: PagePath[] = ['/', '/privacy', '/terms'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: absolute(locale, path),
      alternates: { languages: { en: absolute('en', path), ar: absolute('ar', path) } },
    })),
  );
}
