const locale = 'ar-EG-u-nu-latn';

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits, numberingSystem: 'latn' }).format(value);
}

export function formatPercent(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits,
    numberingSystem: 'latn',
  }).format(value);
}

export function formatMoney(value: number, currency: string): string {
  const safeCurrency = ['EGP', 'USD', 'SAR', 'AED', 'EUR'].includes(currency) ? currency : 'EGP';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: safeCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    numberingSystem: 'latn',
  }).format(value);
}

export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  return new Intl.DateTimeFormat(locale, { ...options, numberingSystem: 'latn' }).format(new Date(value));
}

export function formatPhone(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

export function formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
}
