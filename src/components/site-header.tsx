import Link from 'next/link';

import { getDictionary, localePath, type Locale, type PagePath } from '@/i18n';

import { HeaderBar, MenuDialog } from './header-bar';
import { LanguageSwitch } from './language-switch';
import { NavLinks } from './nav-links';
import { ThemeToggle } from './theme-toggle';
import { Wordmark } from './wordmark';

/**
 * A slim floating bar. On the home page it starts see-through over the locker room and takes the
 * colour of the panels of the stage behind it as you scroll (src/config/stages.ts); a thin orange
 * line along its bottom edge shows how far down the page you are. On a phone: the logo, a short
 * Pre-register and a menu button that opens the rest in a dialog.
 */
export function SiteHeader({ locale, path }: { locale: Locale; path: PagePath }) {
  const t = getDictionary(locale);
  const home = localePath(locale);
  const links = [
    { id: 'features', label: t.nav.features },
    { id: 'inside', label: t.nav.inside },
    { id: 'community', label: t.nav.community },
    { id: 'faq', label: t.nav.faq },
  ];
  const tools = (
    <div className="bar-tools">
      <LanguageSwitch locale={locale} path={path} />
      <span className="bar-tools-rule" aria-hidden="true" />
      <ThemeToggle toLight={t.a11y.toLight} toDark={t.a11y.toDark} />
    </div>
  );
  return (
    <HeaderBar onHome={path === '/'}>
      <Link href={home} aria-label={t.a11y.home} className="bar-logo">
        <Wordmark className="h-6 w-auto" byStage={path === '/'} />
      </Link>
      <nav aria-label={t.a11y.mainNav} className="bar-nav">
        <NavLinks home={home} links={links} />
      </nav>
      <div className="bar-end">
        <div className="bar-wide">{tools}</div>
        <a href={`${home}#pre-register`} className="btn btn-primary bar-cta">
          {t.nav.preRegister}
        </a>
        <MenuDialog open={t.a11y.menu} close={t.a11y.closeMenu} label={t.a11y.mainNav}>
          <NavLinks home={home} links={links} stacked />
          <div className="menu-tools">{tools}</div>
          <a href={`${home}#pre-register`} className="btn btn-primary w-full" data-close>
            {t.nav.preRegister}
          </a>
        </MenuDialog>
      </div>
    </HeaderBar>
  );
}
