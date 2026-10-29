import type { AnalyticsQuery, CohortRow } from './types';
import type { Lead, Enrollment } from '@/schemas/lead';
import type { PaymentRecord } from '@/schemas/payment';
import { computePaymentStatus } from '@/schemas/payment';
import { inAcademyRange } from '@/lib/timezone';

export function inRange(value: string, query: Pick<AnalyticsQuery, 'from' | 'to'>): boolean {
  return inAcademyRange(value, query.from, query.to);
}
export function matchesCourse(courseId: string, query: AnalyticsQuery): boolean {
  return !query.courseId || query.courseId.split(',').filter(Boolean).includes(courseId);
}

export function selectCohort(
  leads: readonly Lead[],
  enrollments: readonly Enrollment[],
  records: readonly PaymentRecord[],
  query: AnalyticsQuery,
): CohortRow[] {
  const leadsById = new Map(leads.map((lead) => [lead.id, lead]));
  return enrollments
    .filter(
      (enrollment) =>
        inRange(enrollment.registeredAt, query) && matchesCourse(enrollment.courseId, query),
    )
    .flatMap((enrollment) => {
      const lead = leadsById.get(enrollment.leadId);
      if (!lead) return [];
      const paymentRecords = records.filter((record) => record.enrollmentId === enrollment.id);
      return [
        {
          enrollment,
          lead,
          records: paymentRecords,
          status: computePaymentStatus(
            enrollment.priceSnapshot,
            paymentRecords,
            enrollment.enrollmentStatus === 'cancelled',
          ),
        },
      ];
    });
}

export function localRangeDays(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.floor((end - start) / 86_400_000) + 1;
}
