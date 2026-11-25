import Link from 'next/link';

import { getDictionary, LOCALES, localePath, type Locale, type PagePath } from '@/i18n';

import { ThemeToggle } from './theme-toggle';
import { Wordmark } from './wordmark';

export function SiteHeader({ locale, path }: { locale: Locale; path: PagePath }) {
  const t = getDictionary(locale);
  const home = localePath(locale);
  const links = [
    { href: `${home}#features`, label: t.nav.features },
    { href: `${home}#community`, label: t.nav.community },
    { href: `${home}#faq`, label: t.nav.faq },
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page">
      <div className="wrap flex h-18 items-center justify-between gap-3">
        <Link href={home} aria-label={t.a11y.home} className="shrink-0">
          <Wordmark className="h-7 w-auto sm:h-8" />
        </Link>
        <nav aria-label={t.a11y.mainNav} className="hidden md:block">
          <ul className="flex gap-8">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="py-3 font-medium hover:text-accent-text">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle toLight={t.a11y.toLight} toDark={t.a11y.toDark} />
          {/* Plain links: each language has its own root layout, so this is a full load. */}
          <ul className="flex">
            {LOCALES.map((item) => (
              <li key={item}>
                <a
                  href={localePath(item, path)}
                  hrefLang={item}
                  aria-current={item === locale || undefined}
                  className="group grid min-h-11 place-items-center rounded-lg px-2 font-medium hover:bg-soft"
                >
                  <span
                    lang={item}
                    className="border-b-2 border-transparent group-aria-current:border-accent"
                  >
                    {t.nav.languages[item]}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <a
            href={`${home}#pre-register`}
            className="btn btn-primary hidden min-h-11! py-1! sm:inline-flex"
          >
            {t.nav.preRegister}
          </a>
        </div>
      </div>
    </header>
  );
}
