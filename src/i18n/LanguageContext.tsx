import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LanguageCode, languages, getLanguage } from './languages';
import { getTranslations, hasManualTranslation, TranslationKeys } from './translations';
import { supabase } from '@/integrations/supabase/client';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: TranslationKeys;
  isRTL: boolean;
  translateDynamic: (text: string) => Promise<string>;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'scan-scholar-language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && languages.some(l => l.code === stored)) {
      return stored as LanguageCode;
    }
    // Try to detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (languages.some(l => l.code === browserLang)) {
      return browserLang as LanguageCode;
    }
    return 'en';
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState<Record<string, Record<string, string>>>({});

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const t = getTranslations(language);
  const isRTL = getLanguage(language)?.rtl || false;

  // Update document direction for RTL languages
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [isRTL, language]);

  // AI translation for dynamic content
  const translateDynamic = useCallback(async (text: string): Promise<string> => {
    if (language === 'en' || !text.trim()) return text;

    // Check cache first
    const cacheKey = `${language}:${text}`;
    if (translationCache[language]?.[text]) {
      return translationCache[language][text];
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { text, targetLanguage: language }
      });

      if (error) throw error;
      
      const translatedText = data?.translatedText || text;
      
      // Cache the result
      setTranslationCache(prev => ({
        ...prev,
        [language]: {
          ...prev[language],
          [text]: translatedText
        }
      }));

      return translatedText;
    } catch (err) {
      console.error('Translation error:', err);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [language, translationCache]);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      isRTL,
      translateDynamic,
      isTranslating
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Utility function to interpolate variables in translations
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/{(\w+)}/g, (_, key) => String(values[key] ?? `{${key}}`));
}
