import type { Metadata, Viewport } from 'next';

import { site } from '@/config/site';
import { THEME_COLORS } from '@/config/theme';
import { getDictionary, localePath, type Locale, type PagePath } from '@/i18n';
import { getLegal } from '@/i18n/legal';

export const absolute = (locale: Locale, path: PagePath = '/') =>
  `${site.url}${localePath(locale, path)}`;

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLORS.light },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLORS.dark },
  ],
  colorScheme: 'light dark',
};

export function pageMetadata(locale: Locale, path: PagePath): Metadata {
  const t = getDictionary(locale);
  const legal = path === '/' ? null : getLegal(locale)[path === '/privacy' ? 'privacy' : 'terms'];
  const title = legal ? `${legal.title} | ${site.name}` : t.meta.title;
  const description = legal?.description ?? t.meta.description;
  const image = { url: `/og/og-${locale}.png`, width: 1200, height: 630, alt: t.meta.ogAlt };
  return {
    metadataBase: new URL(site.url),
    title,
    description,
    applicationName: site.name,
    alternates: {
      canonical: absolute(locale, path),
      languages: {
        en: absolute('en', path),
        ar: absolute('ar', path),
        'x-default': absolute('en', path),
      },
    },
    openGraph: {
      type: 'website',
      siteName: site.name,
      title,
      description,
      url: absolute(locale, path),
      locale: locale === 'ar' ? 'ar_LB' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_LB',
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

/** Organization and WebSite, as one JSON-LD graph. */
export function structuredData(locale: Locale) {
  const organization = `${site.url}/#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organization,
        name: site.name,
        url: site.url,
        logo: `${site.url}/icon-512.png`,
        ...(site.contactEmail && { email: site.contactEmail }),
        ...(site.socials.length && { sameAs: site.socials.map((social) => social.url) }),
      },
      {
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        name: site.name,
        url: site.url,
        description: getDictionary(locale).meta.description,
        inLanguage: ['en', 'ar'],
        publisher: { '@id': organization },
      },
    ],
  };
}
