import { ACADEMY_TIME_ZONE } from '@/lib/timezone';
import type { AppLanguage } from '@/i18n';

const locale = (language: AppLanguage) =>
  language === 'ar' ? 'ar-EG-u-nu-arab' : 'en-US-u-nu-latn';
export function formatAnalyticsNumber(value: number, language: AppLanguage): string {
  return new Intl.NumberFormat(locale(language), { maximumFractionDigits: 1 }).format(value);
}
export function formatAnalyticsPercent(value: number, language: AppLanguage): string {
  return new Intl.NumberFormat(locale(language), {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}
export function formatAnalyticsMoney(
  minor: number,
  currency: string,
  language: AppLanguage,
): string {
  const safeCurrency = ['EGP', 'USD', 'SAR', 'AED', 'EUR'].includes(currency) ? currency : 'EGP';
  return new Intl.NumberFormat(locale(language), {
    style: 'currency',
    currency: safeCurrency,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}
export function formatBucketLabel(
  key: string,
  bucket: 'day' | 'week' | 'month',
  language: AppLanguage,
): string {
  const date = new Date(`${key.length === 7 ? `${key}-01` : key}T12:00:00Z`);
  return new Intl.DateTimeFormat(
    locale(language),
    bucket === 'month'
      ? { month: 'short', year: 'numeric', timeZone: ACADEMY_TIME_ZONE }
      : { month: 'short', day: 'numeric', timeZone: ACADEMY_TIME_ZONE },
  ).format(date);
}
