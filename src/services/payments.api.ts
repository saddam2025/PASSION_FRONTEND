import { ApiError, apiRequest } from '@/api/client';
import type { PaymentRecord } from '@/schemas/payment';
import { majorToMinor } from '@/lib/money';

type RecordInput = Omit<PaymentRecord, 'id' | 'status' | 'recordedBy' | 'createdAt' | 'confirmedBy' | 'confirmedAt'> & { receiptMediaKey?: string };
type WirePayment = RecordInput & { id: string; status: PaymentRecord['status']; recordedBy: string | { id: string }; createdAt: string; confirmedBy?: string | { id: string }; confirmedAt?: string; voidReason?: string; voidedAt?: string; receiptMediaKey?: string };
function mapPayment(row: WirePayment): PaymentRecord & { receiptMediaKey?: string } {
  const actorId = (value: string | { id: string } | undefined) => typeof value === 'string' ? value : value?.id ?? '';
  return { id: row.id, enrollmentId: row.enrollmentId, kind: row.kind, amount: row.amount, currency: row.currency, method: row.method,
    ...(row.reference ? { reference: row.reference } : {}), ...(row.note ? { note: row.note } : {}), receivedAt: row.receivedAt, status: row.status,
    ...(row.voidReason ? { voidReason: row.voidReason } : {}), recordedBy: actorId(row.recordedBy), ...(row.confirmedAt ? { confirmedAt: row.confirmedAt } : {}),
    createdAt: row.createdAt, idempotencyKey: row.idempotencyKey, ...(row.receiptMediaKey ? { receiptMediaKey: row.receiptMediaKey } : {}),
  } as PaymentRecord & { receiptMediaKey?: string };
}

export const apiPaymentsService = {
  async record(input: RecordInput) {
    const { enrollmentId, ...rest } = input;
    const result = await apiRequest<{ payment: WirePayment; paymentSummary: { netMinor: number; status: string; outstandingMinor: number | null }; replayed: boolean }>(`enrollments/${encodeURIComponent(enrollmentId)}/payments`, { method: 'POST', body: JSON.stringify(rest) });
    return mapPayment(result.payment);
  },
  async markUnpaid(enrollmentId: string, reason: string, actorId = '', role: 'admin' | 'assistant' = 'assistant') {
    if (reason.trim().length < 3) throw new ApiError('VALIDATION_ERROR', 422, [{ field: 'reason' }]);
    const { items } = await apiRequest<{ items: WirePayment[] }>(`enrollments/${encodeURIComponent(enrollmentId)}/payments`);
    const record = items.find((item) => item.kind === 'payment' && item.status === 'confirmed' && (role === 'admin' || (typeof item.recordedBy === 'string' ? item.recordedBy : item.recordedBy.id) === actorId));
    if (!record) throw new ApiError('FORBIDDEN', 403);
    await apiRequest(`payments/${encodeURIComponent(record.id)}/void`, { method: 'POST', body: JSON.stringify({ reason: reason.trim() }) });
  },
  async status(enrollmentId: string) {
    const result = await apiRequest<{ paymentSummary: { status: string; netMinor: number; outstandingMinor: number | null }; outstandingMinor: number | null }>(`enrollments/${encodeURIComponent(enrollmentId)}/payments`);
    return { status: result.paymentSummary.status, netMinor: result.paymentSummary.netMinor, outstandingMinor: result.outstandingMinor };
  },
  async majorToMinor(amount: string | number) { return majorToMinor(amount); },
};
