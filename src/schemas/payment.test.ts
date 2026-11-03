import { describe, expect, it } from 'vitest';
import { computePaymentStatus, outstanding } from './payment';
import type { PaymentRecord } from './payment';
const price = { amount: 10000, currency: 'EGP' };
function record(
  kind: PaymentRecord['kind'],
  amount: number,
  status: PaymentRecord['status'] = 'confirmed',
): PaymentRecord {
  return {
    id: `${kind}-${amount}-${status}`,
    enrollmentId: 'e1',
    kind,
    amount,
    currency: 'EGP',
    method: 'cash',
    receivedAt: '2026-01-01T00:00:00.000Z',
    status,
    recordedBy: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    idempotencyKey: `${kind}-${amount}-${status}`,
  };
}
describe('computePaymentStatus', () => {
  it('covers unpaid, pending, partial, paid and failed enum reservation', () => {
    expect(computePaymentStatus(price, [])).toBe('unpaid');
    expect(computePaymentStatus(price, [record('payment', 2000, 'pending')])).toBe('pending');
    expect(computePaymentStatus(price, [record('payment', 2000)])).toBe('partially_paid');
    expect(computePaymentStatus(price, [record('payment', 10000)])).toBe('paid');
    expect(
      [
        'unpaid',
        'pending',
        'partially_paid',
        'paid',
        'failed',
        'cancelled',
        'refunded',
        'partially_refunded',
      ].includes('failed'),
    ).toBe(true);
  });
  it('handles contact-us and cancellation', () => {
    expect(computePaymentStatus({ amount: null, currency: 'EGP' }, [])).toBe('unpaid');
    expect(computePaymentStatus(price, [], true)).toBe('cancelled');
    expect(computePaymentStatus(price, [record('payment', 5000)], true)).toBe('partially_paid');
  });
  it('derives refund outcomes and ignores voided records', () => {
    expect(
      computePaymentStatus(price, [record('payment', 10000), record('refund', 10000)]),
    ).toBe('refunded');
    expect(
      computePaymentStatus(price, [record('payment', 10000), record('refund', 2000)]),
    ).toBe('partially_refunded');
    expect(
      computePaymentStatus(price, [record('payment', 10000), record('payment', 1, 'voided')]),
    ).toBe('paid');
  });
  it('calculates outstanding without negative balances', () => {
    expect(outstanding(price, [record('payment', 2500)])).toBe(7500);
    expect(outstanding(price, [record('payment', 12000)])).toBe(0);
    expect(outstanding({ amount: null, currency: 'EGP' }, [])).toBeNull();
  });
});
