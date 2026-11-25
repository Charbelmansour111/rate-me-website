import { ARABIC_ENABLED } from '../config/site';
import { ar } from './ar';
import { en, type Dictionary } from './en';

export type Locale = 'en' | 'ar';
/** The languages that are on. */
export const LOCALES: readonly Locale[] = ARABIC_ENABLED ? ['en', 'ar'] : ['en'];
export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export const getDictionary = (locale: Locale) => dictionaries[locale];

/** English lives at the root ("/privacy"), Arabic under "/ar" ("/ar/privacy"). */
export type PagePath = '/' | '/privacy' | '/terms';
export const localePath = (locale: Locale, path: PagePath = '/') =>
  locale === 'en' ? path : path === '/' ? '/ar' : `/ar${path}`;
