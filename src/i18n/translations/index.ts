import { en } from './en';
import { es } from './es';
import { ar } from './ar';
import { bn } from './bn';
import { ht } from './ht';
import type { LanguageCode } from '../languages';
import type { TranslationKeys } from './en';

// For languages without full translations, we'll use AI translation
const translations: Partial<Record<LanguageCode, TranslationKeys>> = {
  en,
  es,
  ar,
  bn,
  ht,
};

export const getTranslations = (code: LanguageCode): TranslationKeys => {
  return translations[code] || en;
};

export const hasManualTranslation = (code: LanguageCode): boolean => {
  return code in translations;
};

export type { TranslationKeys };
