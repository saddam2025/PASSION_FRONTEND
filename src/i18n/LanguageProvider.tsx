import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { type AppLanguage } from '@/i18n';

const languageStorageKey = 'passion-language';
const supported = new Set<AppLanguage>(['ar', 'en']);
export function getPreferredLanguage(): AppLanguage {
  const stored = localStorage.getItem(languageStorageKey);
  return stored && supported.has(stored as AppLanguage) ? (stored as AppLanguage) : 'ar';
}
export interface LanguageContextValue { language: AppLanguage; setLanguage: (language: AppLanguage) => void }
export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setCurrentLanguage] = useState<AppLanguage>(() => getPreferredLanguage());
  const setLanguage = useCallback((next: AppLanguage) => {
    if (!supported.has(next)) return;
    setCurrentLanguage(next);
    localStorage.setItem(languageStorageKey, next);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    void i18n.changeLanguage(language);
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <I18nextProvider i18n={i18n}><LanguageContext.Provider value={value}>{children}</LanguageContext.Provider></I18nextProvider>;
}




