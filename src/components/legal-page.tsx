import { Fragment } from 'react';

import { LEGAL_UPDATED, site } from '@/config/site';
import { getDictionary, type Locale } from '@/i18n';
import { getLegal, type LegalKind } from '@/i18n/legal';

import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/** Replaces {email} with a mailto link, or with a plain note until an address is configured. */
function Text({ text, noEmail }: { text: string; noEmail: string }) {
  return text.split('{email}').map((part, i) => (
    <Fragment key={i}>
      {i > 0 &&
        (site.contactEmail ? (
          <a className="link" href={`mailto:${site.contactEmail}`}>
            <bdi>{site.contactEmail}</bdi>
          </a>
        ) : (
          `[${noEmail}]`
        ))}
      {part}
    </Fragment>
  ));
}

export function LegalPage({ locale, kind }: { locale: Locale; kind: LegalKind }) {
  const t = getDictionary(locale);
  const doc = getLegal(locale)[kind];
  const updated = new Date(`${LEGAL_UPDATED}T00:00:00Z`).toLocaleDateString(
    locale === 'ar' ? 'ar-LB-u-nu-latn' : 'en-GB',
    { dateStyle: 'long', timeZone: 'UTC' },
  );
  return (
    <>
      <SiteHeader locale={locale} path={`/${kind}`} />
      <main id="main" className="wrap max-w-4xl! py-16">
        <p className="rounded-lg border-2 border-accent bg-raised px-5 py-4">
          <strong>{t.legal.draft}.</strong> {t.legal.draftText}
        </p>
        <h1 className="display h2 mt-10">{doc.title}</h1>
        <p className="mt-4 text-muted">
          {t.legal.updated}: <time dateTime={LEGAL_UPDATED}>{updated}</time>
        </p>
        <p className="mt-6 text-lg">{doc.intro}</p>
        <nav aria-labelledby="toc" className="mt-10 border-y border-line py-6">
          <h2 id="toc" className="font-semibold">
            {t.legal.contents}
          </h2>
          <ul className="mt-3 gap-x-10 sm:columns-2">
            {doc.sections.map((section) => (
              <li key={section.id}>
                <a className="link inline-block py-1.5" href={`#${section.id}`}>
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="mt-12">
            <h2 className="display h3">{section.title}</h2>
            {section.text?.map((text) => (
              <p key={text} className="mt-4">
                <Text text={text} noEmail={t.legal.noEmail} />
              </p>
            ))}
            {section.points && (
              <ul className="mt-4 list-disc space-y-2 ps-6 marker:text-accent">
                {section.points.map((point) => (
                  <li key={point}>
                    <Text text={point} noEmail={t.legal.noEmail} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
