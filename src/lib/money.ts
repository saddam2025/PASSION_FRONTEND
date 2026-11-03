/** Converts major units to piasters using decimal text and half-up rounding. */
export function majorToMinor(value: string | number): number {
  const source = typeof value === 'number' ? String(value) : value.trim();
  const match = source.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) throw new Error('اكتب مبلغًا صحيحًا أكبر من صفر.');
  const whole = BigInt(match[1]!);
  const fraction = match[2] ?? '';
  let minor = whole * 100n + BigInt((fraction.slice(0, 2) + '00').slice(0, 2));
  if (fraction.length > 2 && fraction[2]! >= '5') minor += 1n;
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('المبلغ أكبر من الحد المسموح.');
  return Number(minor);
}

/** Display conversion only; financial arithmetic stays in integer minor units. */
export function minorToMajor(value: number): number {
  if (!Number.isSafeInteger(value)) throw new Error('قيمة المبلغ غير صالحة.');
  return value / 100;
}
