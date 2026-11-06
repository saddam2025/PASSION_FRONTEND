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
  if (currency === 'EGP' || currency === 'USD') {
    const amount = new Intl.NumberFormat(locale, { maximumFractionDigits: 2, numberingSystem: 'latn' }).format(value);
    return `${amount} ${currency === 'USD' ? '$' : 'ج.م'}`;
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2, numberingSystem: 'latn' }).format(value);
}

/** Formats integer piasters/cents without converting through binary floating point. */
export function formatMoneyMinor(value: number, currency: 'EGP' | 'USD'): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('قيمة المبلغ غير صالحة.');
  const minor = BigInt(value);
  const whole = minor / 100n;
  const fraction = minor % 100n;
  const wholeText = new Intl.NumberFormat(locale, { maximumFractionDigits: 0, numberingSystem: 'latn' }).format(Number(whole));
  const amount = fraction === 0n ? wholeText : `${wholeText}.${String(fraction).padStart(2, '0').replace(/0$/, '')}`;
  return `${amount} ${currency === 'USD' ? '$' : 'ج.م'}`;
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
