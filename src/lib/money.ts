export type MoneyCurrency = 'EGP' | 'USD';
const fractionDigitsByCurrency: Record<MoneyCurrency, number> = { EGP: 2, USD: 2 };

/** Parses decimal text directly to integer piasters/cents; values beyond 2 decimals are rejected. */
export function majorToMinor(value: string | number, currency: MoneyCurrency = 'EGP'): number {
  const source = typeof value === 'number' ? String(value) : value.trim();
  const fractionDigits = fractionDigitsByCurrency[currency];
  const match = source.match(new RegExp(`^(\\d+)(?:\\.(\\d{1,${fractionDigits}}))?$`));
  if (!match) throw new Error('اكتب مبلغًا صحيحًا بمنزلتين عشريتين كحد أقصى.');
  const whole = BigInt(match[1]!);
  const scale = 10n ** BigInt(fractionDigits);
  const fraction = (match[2] ?? '').padEnd(fractionDigits, '0');
  const minor = whole * scale + BigInt(fraction || '0');
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('المبلغ أكبر من الحد المسموح.');
  return Number(minor);
}

/** Display conversion only; financial arithmetic stays in integer minor units. */
export function minorToMajor(value: number): number {
  if (!Number.isSafeInteger(value)) throw new Error('قيمة المبلغ غير صالحة.');
  return value / 100;
}

/** Exact decimal representation for display or a text input, without binary float arithmetic. */
export function minorToMajorText(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('قيمة المبلغ غير صالحة.');
  const minor = BigInt(value);
  const whole = minor / 100n;
  const fraction = String(minor % 100n).padStart(2, '0');
  return fraction === '00' ? String(whole) : `${whole}.${fraction.replace(/0$/, '')}`;
}
