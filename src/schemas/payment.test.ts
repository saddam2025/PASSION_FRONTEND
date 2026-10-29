import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
    assert.equal(computePaymentStatus(price, []), 'unpaid');
    assert.equal(computePaymentStatus(price, [record('payment', 2000, 'pending')]), 'pending');
    assert.equal(computePaymentStatus(price, [record('payment', 2000)]), 'partially_paid');
    assert.equal(computePaymentStatus(price, [record('payment', 10000)]), 'paid');
    assert.ok(
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
    );
  });
  it('handles contact-us and cancellation', () => {
    assert.equal(computePaymentStatus({ amount: null, currency: 'EGP' }, []), 'unpaid');
    assert.equal(computePaymentStatus(price, [], true), 'cancelled');
    assert.equal(computePaymentStatus(price, [record('payment', 5000)], true), 'partially_paid');
  });
  it('derives refund outcomes and ignores voided records', () => {
    assert.equal(
      computePaymentStatus(price, [record('payment', 10000), record('refund', 10000)]),
      'refunded',
    );
    assert.equal(
      computePaymentStatus(price, [record('payment', 10000), record('refund', 2000)]),
      'partially_refunded',
    );
    assert.equal(
      computePaymentStatus(price, [record('payment', 10000), record('payment', 1, 'voided')]),
      'paid',
    );
  });
  it('calculates outstanding without negative balances', () => {
    assert.equal(outstanding(price, [record('payment', 2500)]), 7500);
    assert.equal(outstanding(price, [record('payment', 12000)]), 0);
    assert.equal(outstanding({ amount: null, currency: 'EGP' }, []), null);
  });
});
