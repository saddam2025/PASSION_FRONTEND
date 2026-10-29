import type { Lead, Enrollment } from '@/schemas/lead';
import type { PaymentRecord } from '@/schemas/payment';
import type { CourseRecord } from '@/schemas/course';
import type { AnalyticsInput } from '../types';

const lead = (id: string, createdAt: string, source?: string): Lead => ({
  id, fullName: `Fixture ${id}`, email: `${id}@example.test`, phone: '', phoneNormalized: '', createdAt,
  consent: { acceptedAt: createdAt, policyVersion: 1 }, attribution: source ? { source } : {},
});
const enrollment = (id: string, leadId: string, courseId: string, price: number | null, currency: 'EGP' | 'USD', registeredAt: string, status: Enrollment['enrollmentStatus'] = 'pending', history: Enrollment['history'] = []): Enrollment => ({
  id, leadId, courseId, reference: 'PAS-234567', courseSnapshot: { title: { ar: courseId, en: courseId }, slug: courseId },
  priceSnapshot: { amount: price, currency }, formSnapshot: { fields: [] }, answers: {}, enrollmentStatus: status,
  followUpStatus: 'new', registeredAt, idempotencyKey: id, history,
});
const payment = (id: string, enrollmentId: string, kind: PaymentRecord['kind'], amount: number, currency: 'EGP' | 'USD', status: PaymentRecord['status'], receivedAt: string): PaymentRecord => ({
  id, enrollmentId, kind, amount, currency, method: 'cash', receivedAt, status, recordedBy: 'fixture', createdAt: receivedAt, idempotencyKey: id,
});
const course = (id: string): CourseRecord => ({ id, details: { title: { ar: id, en: id } } } as CourseRecord);

export const edgeCaseInput: AnalyticsInput = {
  query: { from: '2026-10-01', to: '2026-10-31' },
  leads: [lead('l1','2026-10-02T10:00:00Z','search'),lead('l2','2026-10-03T10:00:00Z'),lead('l3','2026-10-04T10:00:00Z','referral'),lead('l4','2026-10-05T10:00:00Z')],
  courses: [course('c1'), course('c2')],
  enrollments: [
    enrollment('e1','l1','c1',10000,'EGP','2026-10-10T10:00:00Z','pending',[{type:'follow_up',actor:'a',at:'2026-10-11T10:00:00Z',from:'new',to:'contacted'}]),
    enrollment('e2','l1','c2',12000,'USD','2026-10-20T10:00:00Z','pending',[{type:'follow_up',actor:'a',at:'2026-10-21T10:00:00Z',from:'new',to:'awaiting_payment'}]),
    enrollment('e3','l2','c1',5000,'EGP','2026-10-30T10:00:00Z'),
    enrollment('e4','l3','c1',null,'EGP','2026-10-30T12:00:00Z'),
    enrollment('e5','l3','c2',10000,'USD','2026-10-11T10:00:00Z'),
    enrollment('e6','l2','c2',5000,'USD','2026-10-15T10:00:00Z','cancelled'),
    enrollment('e7','l3','c1',9000,'EGP','2026-10-18T10:00:00Z'),
    enrollment('e8','l4','c1',1000,'EGP','2026-10-31T23:30:00Z'),
  ],
  paymentRecords: [
    payment('p1','e1','payment',10000,'EGP','confirmed','2026-10-10T12:00:00Z'),
    payment('p2','e2','payment',4000,'USD','confirmed','2026-10-20T12:00:00Z'),
    payment('p3','e3','payment',5000,'EGP','pending','2026-10-30T12:00:00Z'),
    payment('p4','e5','payment',8000,'USD','confirmed','2026-10-12T12:00:00Z'),
    payment('p5','e5','refund',2000,'USD','confirmed','2026-10-13T12:00:00Z'),
    payment('p6','e7','payment',9000,'EGP','voided','2026-10-18T12:00:00Z'),
    payment('p7','e8','payment',1000,'EGP','confirmed','2026-10-31T23:30:00Z'),
  ],
};
