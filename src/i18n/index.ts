import { ar } from './ar';
import { en, type Dictionary } from './en';

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export const getDictionary = (locale: Locale) => dictionaries[locale];
export const otherLocale = (locale: Locale): Locale => (locale === 'en' ? 'ar' : 'en');

/** English lives at the root ("/privacy"), Arabic under "/ar" ("/ar/privacy"). */
export type PagePath = '/' | '/privacy' | '/terms';
export const localePath = (locale: Locale, path: PagePath = '/') =>
  locale === 'en' ? path : path === '/' ? '/ar' : `/ar${path}`;
