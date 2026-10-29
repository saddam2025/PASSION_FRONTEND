export function formatPrice(amount: number, currency: string, language: 'ar' | 'en'): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: currency || 'EGP',
    numberingSystem: language === 'ar' ? 'arab' : 'latn',
    maximumFractionDigits: 2,
  }).format(amount);
}
