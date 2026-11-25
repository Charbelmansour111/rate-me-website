import { getDictionary, localePath, type Locale } from '@/i18n';

import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function NotFoundPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <>
      <SiteHeader locale={locale} path="/" />
      <main id="main" className="wrap py-28">
        <h1 className="display h1">{t.notFound.title}</h1>
        <p className="mt-6 text-lg text-muted">{t.notFound.text}</p>
        <a className="btn btn-primary mt-8" href={localePath(locale)}>
          {t.notFound.back}
        </a>
      </main>
      <SiteFooter locale={locale} path="/" />
    </>
  );
}
