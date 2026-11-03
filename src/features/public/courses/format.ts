import { formatMoney } from '@/lib/formatters';

export function formatPrice(amount: number, currency: string, _language?: 'ar' | 'en'): string {
  void _language;
  return formatMoney(amount, currency || 'EGP');
}
