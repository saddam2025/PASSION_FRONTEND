import { toCsv } from '@/lib/csv';
import { chooseBucket } from '@/lib/analytics/buckets';
import { formatBucketLabel } from '@/lib/analytics/format';
import type { AnalyticsResult } from '@/lib/analytics/types';

type Translate = (key: string) => string;

export function buildAnalyticsCsv(
  data: AnalyticsResult,
  options: {
    from: string;
    to: string;
    bucket?: 'day' | 'week' | 'month';
    currency: string;
    language: 'ar' | 'en';
    t: Translate;
  },
) {
  const { from, to, bucket, currency, language, t } = options;
  const headers = [t('exportType'), t('label'), t('period'), t('value'), t('currency')];
  const moneyKpis = new Set(['collected', 'refunds', 'netRevenue', 'outstanding']);
  const kpis = Object.entries(data.kpis)
    .filter(([, value]) => typeof value === 'number' || (value && typeof value === 'object'))
    .flatMap(([key, value]) =>
      typeof value === 'number'
        ? [[t('kpiRow'), t(`kpi.${key}`), `${from} – ${to}`, value, '']]
        : Object.entries(value).map(([code, amount]) => [
            t('kpiRow'),
            t(`kpi.${key}`),
            `${from} – ${to}`,
            moneyKpis.has(key) ? Number(amount) / 100 : amount,
            code,
          ]),
    );
  const courses = data.coursePerformance.flatMap((row) => {
    const title = row.title[language].replace(/[\r\n]/g, ' ');
    const metrics: Array<[string, number, string]> = [
      ['registrations', row.registrations, ''],
      ['uniqueCustomers', row.uniqueCustomers, ''],
      ['paidEnrollments', row.paid, ''],
      ['partiallyPaid', row.partial, ''],
      ['unpaid', row.unpaid, ''],
      ['conversion', row.conversion ?? 0, ''],
      ['netRevenue', (row.netRevenue[currency] ?? 0) / 100, currency],
      ['outstanding', (row.outstanding[currency] ?? 0) / 100, currency],
    ];
    return metrics.map(([metric, value, code]) => [
      t('courseRow'),
      `${title} · ${t(metric)}`,
      `${from} – ${to}`,
      value,
      code,
    ]);
  });
  const bucketSize = chooseBucket(from, to, bucket);
  const times = data.timeSeries.flatMap((row) => [
    [
      t('timeSeriesRow'),
      `${formatBucketLabel(row.key, bucketSize, language)} · ${t('registrations')}`,
      `${from} – ${to}`,
      row.registrations,
      '',
    ],
    ...data.currencies.flatMap((code) => [
      [
        t('timeSeriesRow'),
        `${formatBucketLabel(row.key, bucketSize, language)} · ${t('collected')}`,
        `${from} – ${to}`,
        (row.collected[code] ?? 0) / 100,
        code,
      ],
      [
        t('timeSeriesRow'),
        `${formatBucketLabel(row.key, bucketSize, language)} · ${t('refunds')}`,
        `${from} – ${to}`,
        (row.refunds[code] ?? 0) / 100,
        code,
      ],
      [
        t('timeSeriesRow'),
        `${formatBucketLabel(row.key, bucketSize, language)} · ${t('netRevenue')}`,
        `${from} – ${to}`,
        (row.net[code] ?? 0) / 100,
        code,
      ],
    ]),
  ]);
  return toCsv(headers, [...kpis, ...courses, ...times]);
}
