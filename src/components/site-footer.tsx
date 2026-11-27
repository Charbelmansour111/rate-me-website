import Image from 'next/image';
import Link from 'next/link';

import { site } from '@/config/site';
import { getDictionary, localePath, type Locale, type PagePath } from '@/i18n';

import { ContactBlock } from './contact-block';
import { CookieSettingsButton } from './cookie-banner';
import { LanguageSwitch } from './language-switch';
import { MotionLoader } from './motion-loader';
import { PitchOutline } from './pitch-lines';
import { SocialIcon } from './social-icon';
import { Wordmark } from './wordmark';

/**
 * The end of the walk: on the field. Over the last part of the scroll the walk dims, the pitch
 * lines draw themselves in and the footer rises in, a part at a time (src/motion/chrome.ts).
 * Without motion it is simply there, drawn.
 */
export function SiteFooter({ locale, path }: { locale: Locale; path: PagePath }) {
  const t = getDictionary(locale);
  const item = 'inline-flex min-h-11 items-center hover:text-accent-text';
  return (
    <footer className="site-footer" data-stage="field" data-footer>
      <MotionLoader />
      {/* Turf and balls under the drawn pitch: atmosphere only, no one in it (docs/PHOTO-CREDITS.md) */}
      <div className="footer-pitch-wrap">
        <Image
          src="/footer/pitch.webp"
          alt=""
          aria-hidden="true"
          width={1600}
          height={414}
          sizes="100vw"
          className="footer-photo"
        />
        <PitchOutline className="footer-pitch" />
      </div>
      <div className="wrap footer-grid">
        <div data-rise>
          <Wordmark className="h-7 w-auto" onBlack />
          <p className="mt-3 text-muted">{t.footer.tagline}</p>
        </div>
        <nav data-rise aria-label={t.a11y.footerNav}>
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
            <li>
              <CookieSettingsButton
                label={t.footer.cookieSettings}
                enabled={site.analytics.enabled}
              />
            </li>
            {site.socials.map((social) => (
              <li key={social.name}>
                <a className={item} href={social.url} rel="noopener me" target="_blank">
                  <SocialIcon name={social.name} />
                  <span className="sr-only">
                    {social.name} {t.a11y.newTab}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div data-rise className="footer-language">
          <LanguageSwitch locale={locale} path={path} />
        </div>
        <div data-rise className="footer-contact">
          <ContactBlock t={t.contactBlock} id="contact-footer" className="text-sm" />
        </div>
      </div>
      <p data-rise className="wrap pb-10 text-sm text-muted">
        © <bdi>{new Date().getFullYear()} Rate Me</bdi>. {t.footer.rights}
      </p>
    </footer>
  );
}
