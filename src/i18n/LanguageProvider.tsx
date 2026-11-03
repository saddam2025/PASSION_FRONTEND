import { createContext, useCallback, useEffect, useMemo, type PropsWithChildren } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { DEFAULT_LANGUAGE, type AppLanguage } from '@/i18n';

export interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}
export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const setLanguage = useCallback((_next: AppLanguage) => {
    if (_next !== DEFAULT_LANGUAGE) return;
    void i18n.changeLanguage(_next);
  }, []);
  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    void i18n.changeLanguage(DEFAULT_LANGUAGE);
  }, []);
  const value = useMemo(() => ({ language: DEFAULT_LANGUAGE, setLanguage }), [setLanguage]);
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
    </I18nextProvider>
  );
}
