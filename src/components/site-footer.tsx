import Link from 'next/link';

import { site } from '@/config/site';
import { getDictionary, localePath, type Locale } from '@/i18n';

import { Wordmark } from './wordmark';

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const item = 'inline-flex min-h-11 items-center hover:text-accent-text';
  return (
    <footer className="inverse">
      <div className="wrap flex flex-wrap items-start justify-between gap-x-12 gap-y-8 py-12">
        <div>
          <Wordmark className="h-8 w-auto" onBlack />
          <p className="mt-3 text-muted">{t.footer.tagline}</p>
        </div>
        <nav aria-label={t.a11y.footerNav}>
          <ul className="flex flex-wrap gap-x-7">
            <li>
              <Link className={item} href={localePath(locale, '/privacy')}>
                {t.footer.privacy}
              </Link>
            </li>
            <li>
              <Link className={item} href={localePath(locale, '/terms')}>
                {t.footer.terms}
              </Link>
            </li>
            {site.contactEmail && (
              <li>
                <a className={item} href={`mailto:${site.contactEmail}`}>
                  {t.footer.contact}
                </a>
              </li>
            )}
            {site.socials.map((social) => (
              <li key={social.name}>
                <a className={item} href={social.url} rel="noopener me" target="_blank">
                  {social.name}
                  <span className="sr-only"> {t.a11y.newTab}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="wrap pb-10 text-sm text-muted">
        © <bdi>{new Date().getFullYear()} Rate Me</bdi>. {t.footer.rights}
      </p>
    </footer>
  );
}
