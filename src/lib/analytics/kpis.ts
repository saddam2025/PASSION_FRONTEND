import { outstanding } from '@/schemas/payment';
import { academyDateKey } from '@/lib/timezone';
import { inRange, matchesCourse, selectCohort } from './query';
import type { AnalyticsInput, AnalyticsKpis, MoneyByCurrency } from './types';

function add(target: MoneyByCurrency, currency: string, amount: number) {
  target[currency] = (target[currency] ?? 0) + amount;
}
export function calculateKpis(input: AnalyticsInput): AnalyticsKpis {
  const { query, leads, enrollments, paymentRecords, courses } = input;
  const cohort = selectCohort(leads, enrollments, paymentRecords, query);
  const enrollmentsById = new Map(enrollments.map((item) => [item.id, item]));
  const collected: MoneyByCurrency = {},
    refunds: MoneyByCurrency = {},
    netRevenue: MoneyByCurrency = {},
    outstandingByCurrency: MoneyByCurrency = {};
  for (const record of paymentRecords) {
    const enrollment = enrollmentsById.get(record.enrollmentId);
    if (
      !enrollment ||
      !matchesCourse(enrollment.courseId, query) ||
      record.status !== 'confirmed' ||
      !inRange(record.receivedAt, query)
    )
      continue;
    if (query.currency && record.currency !== query.currency) continue;
    add(record.kind === 'payment' ? collected : refunds, record.currency, record.amount);
    add(netRevenue, record.currency, record.kind === 'payment' ? record.amount : -record.amount);
  }
  for (const enrollment of enrollments) {
    if (enrollment.enrollmentStatus === 'cancelled' || !matchesCourse(enrollment.courseId, query))
      continue;
    if (query.currency && enrollment.priceSnapshot.currency !== query.currency) continue;
    const balance = outstanding(
      enrollment.priceSnapshot,
      paymentRecords.filter((r) => r.enrollmentId === enrollment.id),
    );
    if (balance !== null) add(outstandingByCurrency, enrollment.priceSnapshot.currency, balance);
  }
  const paid = cohort.filter((row) => row.status === 'paid').length;
  const today = academyDateKey(new Date());
  const recentStart = new Date(`${today}T00:00:00Z`);
  recentStart.setUTCDate(recentStart.getUTCDate() - 6);
  const recentKey = `${recentStart.getUTCFullYear()}-${String(recentStart.getUTCMonth() + 1).padStart(2, '0')}-${String(recentStart.getUTCDate()).padStart(2, '0')}`;
  return {
    publishedCourses: courses.filter(
      (course) =>
        !course.deletedAt && matchesCourse(course.id, query) && course.status === 'published',
    ).length,
    draftCourses: courses.filter(
      (course) => !course.deletedAt && matchesCourse(course.id, query) && course.status === 'draft',
    ).length,
    pendingRevisions: (input.revisions ?? []).filter(
      (revision) =>
        revision.status === 'pending_review' &&
        (!revision.courseId || matchesCourse(revision.courseId, query)),
    ).length,
    newLeads: leads.filter(
      (lead) =>
        inRange(lead.createdAt, query) &&
        (!query.courseId ||
          enrollments.some(
            (enrollment) =>
              enrollment.leadId === lead.id && matchesCourse(enrollment.courseId, query),
          )),
    ).length,
    uniqueCustomers: new Set(cohort.map((row) => row.enrollment.leadId)).size,
    enrollments: cohort.length,
    paidEnrollments: paid,
    partiallyPaid: cohort.filter((row) => row.status === 'partially_paid').length,
    unpaid: cohort.filter((row) => row.status === 'unpaid' || row.status === 'pending').length,
    cancelled: cohort.filter((row) => row.enrollment.enrollmentStatus === 'cancelled').length,
    collected,
    refunds,
    netRevenue,
    outstanding: outstandingByCurrency,
    conversion: cohort.length ? paid / cohort.length : null,
    conversionNumerator: paid,
    conversionDenominator: cohort.length,
    recentCohortHint: query.from <= today && query.to >= recentKey,
  };
}
