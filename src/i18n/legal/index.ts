import type { Locale } from '..';
import { legalAr } from './ar';
import { legalEn } from './en';
import type { LegalTexts } from './types';

export type LegalKind = keyof LegalTexts;

export const getLegal = (locale: Locale): LegalTexts => (locale === 'ar' ? legalAr : legalEn);
