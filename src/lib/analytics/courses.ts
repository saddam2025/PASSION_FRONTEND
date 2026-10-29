import { outstanding } from '@/schemas/payment';
import type { AnalyticsInput, CoursePerformance, MoneyByCurrency } from './types';
import { inRange, matchesCourse, selectCohort } from './query';

export function calculateCoursePerformance(input: AnalyticsInput): CoursePerformance[] {
  const { paymentRecords, courses, query } = input;
  const rows = selectCohort(input.leads, input.enrollments, paymentRecords, query);
  const byCourse = new Map<string, typeof rows>();
  rows.forEach((row) =>
    byCourse.set(row.enrollment.courseId, [...(byCourse.get(row.enrollment.courseId) ?? []), row]),
  );
  return courses
    .filter((item) => !item.deletedAt && matchesCourse(item.id, query))
    .map((course) => {
      const courseId = course.id;
      const cohort = byCourse.get(courseId) ?? [];
      const netRevenue: MoneyByCurrency = {},
        balances: MoneyByCurrency = {};
      for (const enrollment of input.enrollments.filter(
        (item) => item.courseId === courseId && item.enrollmentStatus !== 'cancelled',
      )) {
        const records = paymentRecords.filter((record) => record.enrollmentId === enrollment.id);
        const amount = outstanding(enrollment.priceSnapshot, records);
        if (
          amount !== null &&
          (!query.currency || query.currency === enrollment.priceSnapshot.currency)
        )
          balances[enrollment.priceSnapshot.currency] =
            (balances[enrollment.priceSnapshot.currency] ?? 0) + amount;
      }
      const enrollmentIds = new Set(
        input.enrollments.filter((item) => item.courseId === courseId).map((item) => item.id),
      );
      for (const record of paymentRecords) {
        if (
          !enrollmentIds.has(record.enrollmentId) ||
          record.status !== 'confirmed' ||
          !inRange(record.receivedAt, query) ||
          (query.currency && query.currency !== record.currency)
        )
          continue;
        netRevenue[record.currency] =
          (netRevenue[record.currency] ?? 0) +
          (record.kind === 'payment' ? record.amount : -record.amount);
      }
      const paid = cohort.filter((row) => row.status === 'paid').length;
      return {
        courseId,
        title: course.details.title,
        registrations: cohort.length,
        uniqueCustomers: new Set(cohort.map((row) => row.enrollment.leadId)).size,
        paid,
        partial: cohort.filter((row) => row.status === 'partially_paid').length,
        unpaid: cohort.filter((row) => row.status === 'unpaid' || row.status === 'pending').length,
        conversion: cohort.length ? paid / cohort.length : null,
        netRevenue,
        outstanding: balances,
      };
    })
    .sort((a, b) => b.registrations - a.registrations);
}
