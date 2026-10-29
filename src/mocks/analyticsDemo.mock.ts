// MOCK: deterministic, development-only analytics fixtures. Remove in A4.
import { readMockDb, writeMockDb } from './db';
import type { Lead, Enrollment } from '@/schemas/lead';
import type { PaymentRecord } from '@/schemas/payment';

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

export function generateAnalyticsDemo(now = new Date()): number {
  if (!import.meta.env.DEV) throw new Error('Demo data is only available in development.');
  clearAnalyticsDemo();
  const fresh = readMockDb();
  const random = seeded(0x50415353);
  const followUpStatuses = [
    'new',
    'contacted',
    'interested',
    'awaiting_payment',
    'no_answer',
  ] as const;
  const paymentMethods = ['cash', 'bank_transfer', 'instapay'] as const;
  const courses = fresh.courses.filter((course) => !course.deletedAt);
  if (!courses.length) return 0;
  const leadIds: string[] = [],
    enrollmentIds: string[] = [],
    paymentIds: string[] = [];
  const leadCount = 110;
  for (let index = 0; index < 150; index += 1) {
    const leadIndex = index < leadCount ? index : Math.floor(random() * leadCount);
    const leadId = `demo-lead-${leadIndex + 1}`;
    if (!leadIds.includes(leadId)) {
      const createdAt = new Date(
        now.getTime() - Math.floor(random() * 90) * 86_400_000,
      ).toISOString();
      const lead: Lead = {
        id: leadId,
        fullName: `Demo contact ${leadIndex + 1}`,
        email: `demo-${leadIndex + 1}@example.test`,
        phone: `+20100000${String(leadIndex).padStart(4, '0')}`,
        phoneNormalized: `20100000${String(leadIndex).padStart(4, '0')}`,
        createdAt,
        consent: { acceptedAt: createdAt, policyVersion: 1 },
        attribution:
          index % 5 === 0
            ? {}
            : { source: ['organic', 'campaign', 'whatsapp', 'referral'][index % 4] },
        isDemo: true,
      };
      fresh.leads.push(lead);
      leadIds.push(leadId);
    }
    const course = courses[index % courses.length];
    const enrollmentId = `demo-enrollment-${index + 1}`;
    const registeredAt = new Date(
      now.getTime() - Math.floor(random() * 90) * 86_400_000,
    ).toISOString();
    const amount = index % 23 === 0 ? null : index % 2 === 0 ? 120_000 : 80_000;
    const currency = index % 2 === 0 ? 'EGP' : 'USD';
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let refIndex = index + 2;
    let ref = '';
    for (let digit = 0; digit < 6; digit += 1) {
      ref = alphabet[refIndex % alphabet.length] + ref;
      refIndex = Math.floor(refIndex / alphabet.length);
    }
    const enrollment: Enrollment = {
      id: enrollmentId,
      reference: `PAS-${ref}`,
      leadId,
      courseId: course.id,
      courseSnapshot: { title: course.details.title, slug: course.details.slug },
      priceSnapshot: { amount, currency },
      formSnapshot: { fields: [] },
      answers: {},
      enrollmentStatus: index % 13 === 0 ? 'cancelled' : index % 4 === 0 ? 'confirmed' : 'pending',
      followUpStatus: followUpStatuses[index % followUpStatuses.length],
      assignedToUserId: undefined,
      registeredAt,
      idempotencyKey: enrollmentId,
      history: [],
      isDemo: true,
    };
    fresh.enrollments.push(enrollment);
    enrollmentIds.push(enrollmentId);
    const paymentDate = new Date(new Date(registeredAt).getTime() + 2 * 86_400_000).toISOString();
    if (index % 3 !== 0 && amount !== null) {
      const payment: PaymentRecord = {
        id: `demo-payment-${index + 1}`,
        enrollmentId,
        kind: 'payment',
        amount: index % 7 === 0 ? Math.floor(amount / 2) : amount,
        currency,
        method: paymentMethods[index % paymentMethods.length],
        receivedAt: paymentDate,
        status: index % 11 === 0 ? 'voided' : index % 9 === 0 ? 'pending' : 'confirmed',
        recordedBy: 'demo',
        createdAt: paymentDate,
        idempotencyKey: `demo-payment-${index + 1}`,
        isDemo: true,
      };
      fresh.payments.push(payment);
      paymentIds.push(payment.id);
      if (index % 17 === 0) {
        const refundId = `demo-refund-${index + 1}`;
        fresh.payments.push({
          ...payment,
          id: refundId,
          kind: 'refund',
          amount: Math.floor(payment.amount / 4),
          receivedAt: new Date(new Date(paymentDate).getTime() + 86_400_000).toISOString(),
          idempotencyKey: refundId,
        });
        paymentIds.push(refundId);
      }
    }
  }
  fresh.demoIds = { leads: leadIds, enrollments: enrollmentIds, payments: paymentIds };
  writeMockDb(fresh);
  return enrollmentIds.length;
}

export function clearAnalyticsDemo(): void {
  if (!import.meta.env.DEV) return;
  const db = readMockDb();
  const ids = db.demoIds ?? { leads: [], enrollments: [], payments: [] };
  db.leads = db.leads.filter((item) => !ids.leads.includes(item.id));
  db.enrollments = db.enrollments.filter((item) => !ids.enrollments.includes(item.id));
  db.payments = db.payments.filter((item) => !ids.payments.includes(item.id));
  db.demoIds = { leads: [], enrollments: [], payments: [] };
  writeMockDb(db);
}
