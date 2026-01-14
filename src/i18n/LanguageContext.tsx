import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { LanguageCode, languages, getLanguage } from './languages';
import { getTranslations, TranslationKeys } from './translations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

// Get initial language from localStorage synchronously to avoid flash
function getInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  
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
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);
  const [isTranslating, setIsTranslating] = useState(false);
  const translationCacheRef = useRef<Record<string, Record<string, string>>>({});
  const { user, isLoading: authLoading } = useAuth();
  const languageLoadedFromDb = useRef(false);

  // Load language preference from database when user is authenticated
  useEffect(() => {
    // Skip if auth is still loading or we already loaded from db
    if (authLoading || !user || languageLoadedFromDb.current) return;

    const loadUserLanguage = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .single();
        
        if (profile?.preferred_language && languages.some(l => l.code === profile.preferred_language)) {
          setLanguageState(profile.preferred_language as LanguageCode);
          localStorage.setItem(STORAGE_KEY, profile.preferred_language);
        }
        languageLoadedFromDb.current = true;
      } catch {
        // Silently fail - use local storage value
      }
    };

    loadUserLanguage();
  }, [user, authLoading]);

  // Reset the flag when user changes
  useEffect(() => {
    if (!user) {
      languageLoadedFromDb.current = false;
    }
  }, [user]);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);

    // Save to database if user is authenticated
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ preferred_language: code })
          .eq('id', user.id);
      } catch {
        // Silently fail - local storage is the fallback
      }
    }
  }, [user]);

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
    if (translationCacheRef.current[language]?.[text]) {
      return translationCacheRef.current[language][text];
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { text, targetLanguage: language }
      });

      if (error) throw error;
      
      const translatedText = data?.translatedText || text;
      
      // Cache the result
      if (!translationCacheRef.current[language]) {
        translationCacheRef.current[language] = {};
      }
      translationCacheRef.current[language][text] = translatedText;

      return translatedText;
    } catch (err) {
      console.error('Translation error:', err);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

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
