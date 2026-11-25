import Link from 'next/link';

import { getDictionary, localePath, type Locale, type PagePath } from '@/i18n';

import { LanguageSwitch } from './language-switch';
import { NavLinks } from './nav-links';
import { ThemeToggle } from './theme-toggle';
import { Wordmark } from './wordmark';

export function SiteHeader({ locale, path }: { locale: Locale; path: PagePath }) {
  const t = getDictionary(locale);
  const home = localePath(locale);
  const links = [
    { id: 'features', label: t.nav.features },
    { id: 'community', label: t.nav.community },
    { id: 'faq', label: t.nav.faq },
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page">
      <div className="wrap flex h-18 items-center justify-between gap-3">
        <Link href={home} aria-label={t.a11y.home} className="shrink-0">
          <Wordmark className="h-7 w-auto sm:h-8" />
        </Link>
        <nav aria-label={t.a11y.mainNav} className="hidden md:block">
          <NavLinks home={home} links={links} />
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle toLight={t.a11y.toLight} toDark={t.a11y.toDark} />
          <LanguageSwitch locale={locale} path={path} />
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
