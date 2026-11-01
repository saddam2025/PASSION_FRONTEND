import { ACADEMY_TIME_ZONE } from '@/lib/timezone';
import { formatDate, formatMoney, formatNumber, formatPercent } from '@/lib/formatters';

export function formatAnalyticsNumber(value: number, _language?: 'ar' | 'en'): string {
  void _language;
  return formatNumber(value, 1);
}
export function formatAnalyticsPercent(value: number, _language?: 'ar' | 'en'): string {
  void _language;
  return formatPercent(value, 0);
}
export function formatAnalyticsMoney(
  minor: number,
  currency: string,
  _language?: 'ar' | 'en',
): string {
  void _language;
  return formatMoney(minor / 100, currency);
}
export function formatBucketLabel(
  key: string,
  bucket: 'day' | 'week' | 'month',
  _language?: 'ar' | 'en',
): string {
  void _language;
  const date = new Date(`${key.length === 7 ? `${key}-01` : key}T12:00:00Z`);
  return formatDate(date, {
    ...(bucket === 'month' ? { month: 'short', year: 'numeric' } : { month: 'short', day: 'numeric' }),
    timeZone: ACADEMY_TIME_ZONE,
  });
}
