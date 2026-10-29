export function normalizePhone(input: string, defaultCountryCode = '+20'): string {
  let digits = input.replace(/\D/g, '');
  if (input.trim().startsWith('00')) digits = digits.slice(2);
  const country = defaultCountryCode.replace(/\D/g, '');
  if (digits.startsWith('0') && country === '20' && /^01\d{9}$/.test(digits))
    return `20${digits.slice(1)}`;
  if (digits.startsWith(country) && country) return digits;
  if (input.trim().startsWith('+')) return digits;
  if (digits.startsWith('0')) digits = digits.slice(1);
  return `${country}${digits}`;
}
export function isLikelyValidPhone(value: string): boolean {
  return /^\d{8,15}$/.test(value);
}
export function formatPhoneDisplay(value: string): string {
  return value ? `+${value.replace(/\D/g, '')}` : '';
}
