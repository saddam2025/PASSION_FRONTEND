import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AnalyticsResult } from '@/lib/analytics';
import type { AppLanguage } from '@/i18n';
import { formatAnalyticsNumber } from '@/lib/analytics/format';
import { ChartCard } from './ChartCard';
import { chartColors, reducedMotion, useChartNames } from './chartUtils';

export function CourseComparisonChart({
  data,
  language,
  loading,
  error,
  retry,
}: {
  data: AnalyticsResult;
  language: AppLanguage;
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const t = useChartNames();
  const top = data.coursePerformance.slice(0, 8).map((item) => ({
    name: item.title[language],
    registrations: item.registrations,
    paid: item.paid,
    conversion: item.conversion,
  }));
  const rest = data.coursePerformance.slice(8);
  const otherRegistrations = rest.reduce((sum, item) => sum + item.registrations, 0);
  const points = otherRegistrations
    ? [
        ...top,
        {
          name: t('other'),
          registrations: otherRegistrations,
          paid: rest.reduce((sum, item) => sum + item.paid, 0),
          conversion: otherRegistrations
            ? rest.reduce((sum, item) => sum + item.paid, 0) / otherRegistrations
            : null,
        },
      ]
    : top;
  return (
    <ChartCard
      title={t('courseComparison')}
      definition={t('definitions.cohort')}
      loading={loading}
      error={error}
      onRetry={retry}
      empty={!points.length}
      ariaLabel={t('courseComparison')}
      tableHeaders={[t('course'), t('registrations'), t('paidEnrollments'), t('conversion')]}
      tableRows={points.map((item) => ({
        cells: [
          item.name,
          item.registrations,
          item.paid,
          item.conversion === null ? '—' : `${Math.round(item.conversion * 100)}%`,
        ],
      }))}
    >
      <div role="img" aria-label={t('courseComparison')} dir="ltr">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={points}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis
              allowDecimals={false}
              tickFormatter={(value: number) => formatAnalyticsNumber(value, language)}
            />
            <Tooltip
              wrapperStyle={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
              formatter={(value: unknown, name: unknown) => [
                formatAnalyticsNumber(Number(value), language),
                String(name ?? ''),
              ]}
            />
            <Bar
              dataKey="registrations"
              name={t('registrations')}
              fill={chartColors[0]}
              isAnimationActive={!reducedMotion()}
            />
            <Bar
              dataKey="paid"
              name={t('paidEnrollments')}
              fill={chartColors[1]}
              isAnimationActive={!reducedMotion()}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap gap-3 text-xs" aria-label={t('chartLegend')}>
        <li className="inline-flex items-center gap-1">
          <span aria-hidden="true" className="size-2 rounded-full bg-[var(--chart-1)]" />
          {t('registrations')}
        </li>
        <li className="inline-flex items-center gap-1">
          <span aria-hidden="true" className="size-2 rounded-full bg-[var(--chart-2)]" />
          {t('paidEnrollments')}
        </li>
      </ul>
    </ChartCard>
  );
}
