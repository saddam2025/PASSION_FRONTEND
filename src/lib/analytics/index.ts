import type { AnalyticsInput, AnalyticsQuery, AnalyticsResult, TimeSeriesPoint } from './types';
import { academyDateKey, addCalendarDays, inAcademyRange } from '@/lib/timezone';
import { chooseBucket, bucketKey, bucketKeys } from './buckets';
import { calculateKpis } from './kpis';
import { calculateFunnel } from './funnel';
import { calculateDistributions } from './distributions';
import { calculateCoursePerformance } from './courses';
import { calculateSources } from './sources';
import { matchesCourse, selectCohort } from './query';

function buildSeries(input: AnalyticsInput): TimeSeriesPoint[] {
  const bucket = chooseBucket(input.query.from, input.query.to, input.query.bucket);
  const keys = bucketKeys(input.query.from, input.query.to, bucket);
  const points = new Map(
    keys.map((key) => [
      key,
      { key, registrations: 0, collected: {}, refunds: {}, net: {} } as TimeSeriesPoint,
    ]),
  );
  const cohort = selectCohort(input.leads, input.enrollments, input.paymentRecords, input.query);
  for (const row of cohort) {
    const key = bucketKey(academyDateKey(row.enrollment.registeredAt), bucket);
    const point = points.get(key);
    if (point) point.registrations += 1;
  }
  const courseIds = new Set(
    input.enrollments.filter((e) => matchesCourse(e.courseId, input.query)).map((e) => e.id),
  );
  for (const record of input.paymentRecords) {
    if (
      !courseIds.has(record.enrollmentId) ||
      record.status !== 'confirmed' ||
      !inAcademyRange(record.receivedAt, input.query.from, input.query.to)
    )
      continue;
    if (input.query.currency && record.currency !== input.query.currency) continue;
    const key = bucketKey(academyDateKey(record.receivedAt), bucket);
    const point = points.get(key);
    if (!point) continue;
    const target = record.kind === 'payment' ? point.collected : point.refunds;
    target[record.currency] = (target[record.currency] ?? 0) + record.amount;
    point.net[record.currency] =
      (point.net[record.currency] ?? 0) +
      (record.kind === 'payment' ? record.amount : -record.amount);
  }
  return [...points.values()];
}

function build(input: AnalyticsInput): AnalyticsResult {
  const kpis = calculateKpis(input);
  const currencies = [
    ...new Set([
      ...input.paymentRecords.filter((r) => r.status === 'confirmed').map((r) => r.currency),
      ...input.enrollments
        .filter((e) => e.priceSnapshot.amount !== null)
        .map((e) => e.priceSnapshot.currency),
    ]),
  ].sort();
  const sourceRows = calculateSources(input);
  return {
    query: input.query,
    kpis,
    timeSeries: buildSeries(input),
    funnel: calculateFunnel(input),
    distributions: calculateDistributions(input),
    coursePerformance: calculateCoursePerformance(input),
    sources: sourceRows,
    currencies,
    defaultCurrency: 'EGP',
    courseOptions: input.courses
      .filter((course) => !course.deletedAt)
      .map((course) => ({ id: course.id, title: course.draft?.details.title ?? course.details?.title ?? { ar: '', en: '' } })),
    hasAttribution: selectCohort(
      input.leads,
      input.enrollments,
      input.paymentRecords,
      input.query,
    ).some((row) => Boolean(row.lead.attribution.source)),
    hasDemoData:
      input.leads.some((lead) => lead.isDemo) ||
      input.enrollments.some((item) => item.isDemo) ||
      input.paymentRecords.some((item) => item.isDemo),
  };
}

function previousQuery(query: AnalyticsQuery): AnalyticsQuery {
  const days =
    Math.floor(
      (Date.parse(`${query.to}T00:00:00Z`) - Date.parse(`${query.from}T00:00:00Z`)) / 86_400_000,
    ) + 1;
  return {
    ...query,
    from: addCalendarDays(query.from, -days),
    to: addCalendarDays(query.from, -1),
    compare: false,
  };
}

export function calculateAnalytics(input: AnalyticsInput): AnalyticsResult {
  const result = build(input);
  if (input.query.compare) result.compare = build({ ...input, query: previousQuery(input.query) });
  return result;
}

export type {
  AnalyticsInput,
  AnalyticsQuery,
  AnalyticsResult,
  MoneyByCurrency,
  TimeSeriesPoint,
} from './types';
