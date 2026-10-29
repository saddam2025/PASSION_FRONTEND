// MOCK: manual payment records; immutable except Admin void; replace in A3.
import { mockAuthService } from './auth.mock';
import { readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import { hasPermission } from '@/schemas/permissions';
import { PaymentRecordSchema, computePaymentStatus, outstanding } from '@/schemas/payment';
import type { PaymentRecord } from '@/schemas/payment';
import { ForbiddenError } from './leads.mock';
async function actor(
  permission: 'viewPayments' | 'recordPayments' | 'viewFinancialReports' = 'viewPayments',
  admin = false,
) {
  const user = await mockAuthService.getCurrentUser();
  if (!user || !hasPermission(user, permission) || (admin && user.role !== 'admin'))
    throw new ForbiddenError('Not permitted');
  return user;
}
export const paymentsService = {
  async list(
    filters: {
      status?: PaymentRecord['status'];
      method?: PaymentRecord['method'];
      kind?: PaymentRecord['kind'];
      courseId?: string;
      recordedBy?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const current = await actor();
    const db = readMockDb();
    const filtered = db.payments
      .filter((record) => {
        const enrollment = db.enrollments.find((e) => e.id === record.enrollmentId);
        return (
          (!filters.status || record.status === filters.status) &&
          (!filters.method || record.method === filters.method) &&
          (!filters.kind || record.kind === filters.kind) &&
          (!filters.courseId || enrollment?.courseId === filters.courseId) &&
          (!filters.recordedBy || record.recordedBy === filters.recordedBy) &&
          (!filters.dateFrom || record.receivedAt >= filters.dateFrom) &&
          (!filters.dateTo || record.receivedAt <= filters.dateTo)
        );
      })
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
    const page = Math.max(filters.page ?? 1, 1),
      pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 50);
    const canSeeTotals = hasPermission(current, 'viewFinancialReports');
    const totals = canSeeTotals
      ? Object.fromEntries(
          [
            ...new Set(
              filtered.filter((item) => item.status === 'confirmed').map((item) => item.currency),
            ),
          ].map((currency) => [
            currency,
            filtered
              .filter((item) => item.currency === currency && item.status === 'confirmed')
              .reduce(
                (sum, item) => sum + (item.kind === 'payment' ? item.amount : -item.amount),
                0,
              ),
          ]),
        )
      : undefined;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize).map((record) => ({
      ...record,
      enrollment: db.enrollments.find((e) => e.id === record.enrollmentId),
      lead: db.leads.find(
        (l) => l.id === db.enrollments.find((e) => e.id === record.enrollmentId)?.leadId,
      ),
    }));
    return {
      items,
      total: filtered.length,
      page,
      pageSize,
      pageCount: Math.ceil(filtered.length / pageSize),
      totals,
    };
  },
  async record(
    input: Omit<
      PaymentRecord,
      'id' | 'status' | 'recordedBy' | 'createdAt' | 'confirmedBy' | 'confirmedAt'
    > & { acknowledgeOverpayment?: boolean },
  ) {
    const user = await actor('recordPayments');
    const db = readMockDb();
    const enrollment = db.enrollments.find((e) => e.id === input.enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    if (input.kind !== 'payment' || input.currency !== enrollment.priceSnapshot.currency)
      throw new Error('Invalid payment');
    const due = outstanding(
      enrollment.priceSnapshot,
      db.payments.filter((p) => p.enrollmentId === enrollment.id),
    );
    if (due !== null && input.amount > due && !input.acknowledgeOverpayment)
      throw new Error('Overpayment acknowledgement required');
    const duplicate = db.payments.find((p) => p.idempotencyKey === input.idempotencyKey);
    if (duplicate) return duplicate;
    const { acknowledgeOverpayment: _acknowledged, ...paymentInput } = input;
    void _acknowledged;
    const record = PaymentRecordSchema.parse({
      ...paymentInput,
      id: crypto.randomUUID(),
      status: 'confirmed',
      recordedBy: user.id,
      confirmedBy: user.id,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    db.payments.unshift(record);
    recordMockAudit(db, user.id, 'payment.recorded', record.id);
    db.notifications.unshift({
      id: crypto.randomUUID(),
      type: 'payment_recorded',
      entityId: record.id,
      recipientRole: 'admin',
      createdAt: record.createdAt,
      readAt: null,
    });
    writeMockDb(db);
    return record;
  },
  async void(id: string, reason: string) {
    const user = await actor('viewPayments', true);
    if (reason.trim().length < 3) throw new Error('Reason required');
    const db = readMockDb();
    const p = db.payments.find((x) => x.id === id);
    if (!p || p.status === 'voided') throw new Error('Payment not found');
    p.status = 'voided';
    p.voidReason = reason.trim();
    recordMockAudit(db, user.id, 'payment.voided', id);
    writeMockDb(db);
    return p;
  },
  async refund(
    enrollmentId: string,
    amount: number,
    method: PaymentRecord['method'],
    reason: string,
  ) {
    const user = await actor('viewPayments', true);
    if (reason.trim().length < 3) throw new Error('Reason required');
    const db = readMockDb();
    const enrollment = db.enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    const existing = db.payments.filter(
      (p) => p.enrollmentId === enrollmentId && p.status === 'confirmed',
    );
    const net = existing.reduce((sum, p) => sum + (p.kind === 'payment' ? p.amount : -p.amount), 0);
    if (amount > net) throw new Error('Refund exceeds confirmed net payments');
    const record = PaymentRecordSchema.parse({
      id: crypto.randomUUID(),
      enrollmentId,
      kind: 'refund',
      amount,
      currency: enrollment.priceSnapshot.currency,
      method,
      note: reason.trim(),
      receivedAt: new Date().toISOString(),
      status: 'confirmed',
      recordedBy: user.id,
      confirmedBy: user.id,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      idempotencyKey: crypto.randomUUID(),
    });
    db.payments.unshift(record);
    recordMockAudit(db, user.id, 'payment.refunded', record.id);
    writeMockDb(db);
    return record;
  },
  async status(enrollmentId: string) {
    await actor();
    const db = readMockDb();
    const e = db.enrollments.find((x) => x.id === enrollmentId);
    if (!e) throw new Error('Enrollment not found');
    const records = db.payments.filter((x) => x.enrollmentId === enrollmentId);
    return {
      status: computePaymentStatus(e.priceSnapshot, records, e.enrollmentStatus === 'cancelled'),
      outstanding: outstanding(e.priceSnapshot, records),
    };
  },
};
