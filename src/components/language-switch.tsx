import { getDictionary, LOCALES, localePath, type Locale, type PagePath } from '@/i18n';

/**
 * The language is the URL and nothing else: no cookie, no detection. Nothing is shown while
 * only one language is on (ARABIC_ENABLED in src/config/site.ts).
 */
export function LanguageSwitch({ locale, path }: { locale: Locale; path: PagePath }) {
  if (LOCALES.length < 2) return null;
  const t = getDictionary(locale);
  return (
    <ul className="flex" aria-label={t.a11y.language}>
      {LOCALES.map((item) => (
        <li key={item}>
          {/* A plain link: each language has its own root layout, so this is a full load. */}
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
  );
}
