import type { AnalyticsInput, DistributionItem } from './types';
import { selectCohort } from './query';

function distribution(values: readonly string[]): DistributionItem[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts]
    .map(([key, count]) => ({ key, count, percent: values.length ? count / values.length : 0 }))
    .sort((a, b) => b.count - a.count);
}

export function calculateDistributions(input: AnalyticsInput) {
  const cohort = selectCohort(input.leads, input.enrollments, input.paymentRecords, input.query);
  const byCourse = distribution(cohort.map((row) => row.enrollment.courseId));
  const topCourses = byCourse.slice(0, 6);
  const otherCount = byCourse.slice(6).reduce((sum, item) => sum + item.count, 0);
  const courses = otherCount
    ? [
        ...topCourses,
        {
          key: 'other',
          count: otherCount,
          percent: cohort.length ? otherCount / cohort.length : 0,
        },
      ]
    : topCourses;
  return {
    paymentStatus: distribution(cohort.map((row) => row.status)),
    followUp: distribution(cohort.map((row) => row.enrollment.followUpStatus)),
    courses,
  };
}
