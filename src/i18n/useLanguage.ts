import { useContext } from 'react';
import { LanguageContext } from '@/i18n/LanguageProvider';

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider.');
  return value;
}
export function getBilingualText(value: { ar?: string; en?: string }, language: 'ar' | 'en'): string {
  return value[language]?.trim() || value[language === 'ar' ? 'en' : 'ar']?.trim() || '';
}


