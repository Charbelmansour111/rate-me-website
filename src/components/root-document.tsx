import type { ReactNode } from 'react';

import { site } from '@/config/site';
import { THEME_SCRIPT } from '@/config/theme';
import { getDictionary, type Locale } from '@/i18n';

import { CookieBanner } from './cookie-banner';

export function RootDocument({
  locale,
  fonts,
  children,
}: {
  locale: Locale;
  fonts: string;
  children: ReactNode;
}) {
  const t = getDictionary(locale);
  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      data-theme="light"
      className={`${fonts} antialiased`}
      suppressHydrationWarning
    >
      {/* eslint-disable-next-line @next/next/no-head-element -- App Router root layout */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="btn btn-primary fixed start-4 top-3 z-30 -translate-y-24 focus:translate-y-0"
        >
          {t.a11y.skip}
        </a>
        {children}
        {/* Visitor statistics, only after they are accepted */}
        <CookieBanner t={t.cookies} analytics={site.analytics} />
      </body>
    </html>
  );
}
