import { minorToMajorText } from '@/lib/money';

type PriceSnapshot = { amount: number | null; currency: string };

export function enrollmentCurrency(currency: string | undefined): 'EGP' | 'USD' {
  return currency === 'USD' ? 'USD' : 'EGP';
}

export function paymentDefaultAmount(snapshot: PriceSnapshot): string {
  return snapshot.amount === null ? '' : minorToMajorText(snapshot.amount);
}
