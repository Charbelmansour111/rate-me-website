import Script from 'next/script';
import type { ReactNode } from 'react';

import { site } from '@/config/site';
import { THEME_SCRIPT } from '@/config/theme';
import { getDictionary, type Locale } from '@/i18n';

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
        {site.analytics.enabled && (
          <Script
            src={site.analytics.src}
            data-domain={site.analytics.domain}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
