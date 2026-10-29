import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsResult } from '@/lib/analytics';
import type { AppLanguage } from '@/i18n';
import { formatAnalyticsNumber, formatBucketLabel } from '@/lib/analytics/format';
import { ChartCard } from './ChartCard';
import { chartColors, reducedMotion, useChartNames } from './chartUtils';

export function RegistrationsChart({
  data,
  comparison,
  language,
  loading,
  error,
  retry,
}: {
  data: AnalyticsResult;
  comparison?: AnalyticsResult;
  language: AppLanguage;
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const t = useChartNames();
  const bucket = data.query.bucket ?? 'day';
  const points = data.timeSeries.map((point, index) => ({
    label: formatBucketLabel(point.key, bucket, language),
    registrations: point.registrations,
    previous: comparison?.timeSeries[index]?.registrations ?? 0,
  }));
  return (
    <ChartCard
      title={t('registrationsOverTime')}
      definition={t('definitions.cohort')}
      loading={loading}
      error={error}
      onRetry={retry}
      empty={!points.some((point) => point.registrations || point.previous)}
      ariaLabel={t('registrationsOverTime')}
      tableHeaders={[t('date'), t('registrations'), t('previousPeriod')]}
      tableRows={points.map((point) => ({
        cells: [point.label, point.registrations, point.previous],
      }))}
    >
      <div role="img" aria-label={t('registrationsOverTime')} dir="ltr">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={points}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis
              allowDecimals={false}
              tickFormatter={(value: number) => formatAnalyticsNumber(value, language)}
            />
            <Tooltip
              wrapperStyle={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
              formatter={(value: unknown) => formatAnalyticsNumber(Number(value), language)}
            />
            <Bar
              dataKey="registrations"
              name={t('registrations')}
              fill={chartColors[0]}
              isAnimationActive={!reducedMotion()}
            />
            <Line
              dataKey="previous"
              name={t('previousPeriod')}
              stroke={chartColors[1]}
              strokeDasharray="5 4"
              isAnimationActive={!reducedMotion()}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap gap-3 text-xs" aria-label={t('chartLegend')}>
        <li className="inline-flex items-center gap-1">
          <span aria-hidden="true" className="size-2 rounded-full bg-[var(--chart-1)]" />
          {t('registrations')}
        </li>
        {comparison && (
          <li className="inline-flex items-center gap-1">
            <span aria-hidden="true" className="size-2 rounded-full bg-[var(--chart-2)]" />
            {t('previousPeriod')}
          </li>
        )}
      </ul>
    </ChartCard>
  );
}
