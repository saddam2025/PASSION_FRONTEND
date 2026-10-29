import type { HomeSection } from '@/services/siteContent';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
export function value(section: HomeSection, key: string): unknown {
  return section.content[key];
}
export function text(value: unknown, language: 'ar' | 'en'): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && ('ar' in value || 'en' in value))
    return getBilingualText(value as { ar?: string; en?: string }, language);
  return '';
}
export function list(section: HomeSection, key: string): unknown[] {
  const item = value(section, key);
  return Array.isArray(item) ? item : [];
}
export function useSectionText(section: HomeSection) {
  const { language } = useLanguage();
  return {
    language,
    title: text(value(section, 'title'), language),
    intro: text(value(section, 'intro'), language),
    body: text(value(section, 'text'), language),
  };
}

export { useLanguage } from '@/i18n/useLanguage';
