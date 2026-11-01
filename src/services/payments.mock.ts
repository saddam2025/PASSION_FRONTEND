// MOCK: immutable payment records with status derived from the registration's records.
import { mockAuthService } from './auth.mock';
import { readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import { hasPermission } from '@/schemas/permissions';
import { PaymentRecordSchema, computePaymentStatus, outstanding } from '@/schemas/payment';
import type { PaymentRecord } from '@/schemas/payment';
import { ForbiddenError } from './leads.mock';

async function actor(permission: 'viewPayments' | 'recordPayments') {
  const user = await mockAuthService.getCurrentUser();
  const isAllowedAssistantPayment = user?.role === 'assistant' && permission === 'recordPayments';
  if (!user || (!isAllowedAssistantPayment && !hasPermission(user, permission))) throw new ForbiddenError('Not permitted');
  return user;
}

export const paymentsService = {
  async record(input: Omit<PaymentRecord, 'id' | 'status' | 'recordedBy' | 'createdAt' | 'confirmedBy' | 'confirmedAt'>) {
    const user = await actor('recordPayments');
    const db = readMockDb();
    const enrollment = db.enrollments.find((item) => item.id === input.enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    if (input.kind !== 'payment' || input.currency !== enrollment.priceSnapshot.currency) throw new Error('Invalid payment');
    const due = outstanding(enrollment.priceSnapshot, db.payments.filter((item) => item.enrollmentId === enrollment.id));
    if (due !== null && input.amount > due) throw new Error('Payment exceeds the remaining course price');
    const duplicate = db.payments.find((item) => item.idempotencyKey === input.idempotencyKey);
    if (duplicate) return duplicate;
    const now = new Date().toISOString();
    const record = PaymentRecordSchema.parse({
      ...input,
      id: crypto.randomUUID(),
      status: 'confirmed',
      recordedBy: user.id,
      confirmedBy: user.id,
      confirmedAt: now,
      createdAt: now,
    });
    db.payments.unshift(record);
    recordMockAudit(db, user.id, 'payment.recorded', record.id);
    writeMockDb(db);
    return record;
  },
  async markUnpaid(enrollmentId: string, reason: string) {
    const user = await actor('recordPayments');
    if (reason.trim().length < 3) throw new Error('A reason is required');
    const db = readMockDb();
    const records = db.payments.filter((item) => item.enrollmentId === enrollmentId && item.status === 'confirmed' && item.kind === 'payment');
    if (!records.length) throw new Error('No confirmed payment to revert');
    const now = new Date().toISOString();
    for (const record of records) {
      record.status = 'voided';
      record.voidReason = reason.trim();
      record.confirmedAt = now;
    }
    recordMockAudit(db, user.id, 'payment.voided', enrollmentId, { reason: reason.trim() });
    writeMockDb(db);
  },
  async status(enrollmentId: string) {
    await actor('viewPayments');
    const db = readMockDb();
    const enrollment = db.enrollments.find((item) => item.id === enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    const records = db.payments.filter((item) => item.enrollmentId === enrollmentId);
    return { status: computePaymentStatus(enrollment.priceSnapshot, records, enrollment.enrollmentStatus === 'cancelled'), outstanding: outstanding(enrollment.priceSnapshot, records) };
  },
};
