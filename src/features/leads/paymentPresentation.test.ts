import { describe, expect, it } from 'vitest';
import { enrollmentCurrency, paymentDefaultAmount } from './paymentPresentation';

describe('currency-aware payment presentation', () => {
  it('keeps the USD snapshot currency read-only and defaults the payment amount from cents', () => {
    const snapshot = { amount: 12550, currency: 'USD' };
    expect(enrollmentCurrency(snapshot.currency)).toBe('USD');
    expect(paymentDefaultAmount(snapshot)).toBe('125.5');
  });

  it('keeps the EGP default and contact-price behavior backward compatible', () => {
    expect(enrollmentCurrency('EGP')).toBe('EGP');
    expect(paymentDefaultAmount({ amount: 200000, currency: 'EGP' })).toBe('2000');
    expect(paymentDefaultAmount({ amount: null, currency: 'USD' })).toBe('');
  });
});
