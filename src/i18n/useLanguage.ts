import { useContext } from 'react';
import { LanguageContext } from '@/i18n/LanguageProvider';

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider.');
  return value;
}

export function tx(value: string | { ar?: string; en?: string } | null | undefined): string {
  if (typeof value === 'string') return value.trim();
  return value?.ar?.trim() ?? '';
}

export function getBilingualText(value: { ar?: string; en?: string } | null | undefined, _language: 'ar' | 'en' = 'ar'): string {
  void _language;
  return tx(value);
}
