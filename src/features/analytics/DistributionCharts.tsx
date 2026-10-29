import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AnalyticsResult } from '@/lib/analytics';
import type { AppLanguage } from '@/i18n';
import { formatAnalyticsNumber, formatAnalyticsPercent } from '@/lib/analytics/format';
import { ChartCard } from './ChartCard';
import { chartColors, reducedMotion, useChartNames } from './chartUtils';

function Donut({
  title,
  definition,
  rows,
  loading,
  error,
  retry,
  name,
  language,
}: {
  title: string;
  definition: string;
  rows: AnalyticsResult['distributions']['paymentStatus'];
  loading: boolean;
  error: boolean;
  retry: () => void;
  name: string;
  language: AppLanguage;
}) {
  const t = useChartNames();
  const values = rows.map((row, index) => ({
    ...row,
    label: t(`${name}.${row.key}`, { defaultValue: row.key }),
    color: chartColors[index % chartColors.length],
  }));
  const total = values.reduce((sum, item) => sum + item.count, 0);
  return (
    <ChartCard
      title={title}
      definition={definition}
      loading={loading}
      error={error}
      onRetry={retry}
      empty={!values.length}
      ariaLabel={title}
      tableHeaders={[t('category'), t('count'), t('percent')]}
      tableRows={values.map((row) => ({
        cells: [
          row.label,
          formatAnalyticsNumber(row.count, language),
          formatAnalyticsPercent(row.percent, language),
        ],
      }))}
    >
      <div role="img" aria-label={title} dir="ltr">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={values}
              dataKey="count"
              nameKey="label"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={2}
              isAnimationActive={!reducedMotion()}
            >
              <Label value={formatAnalyticsNumber(total, language)} position="center" />
              {values.map((value) => (
                <Cell key={value.key} fill={value.color} stroke="var(--color-surface)" />
              ))}
            </Pie>
            <Tooltip
              wrapperStyle={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
              formatter={(value: unknown, name: unknown) => [
                formatAnalyticsNumber(Number(value), language),
                String(name ?? ''),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {values.map((row) => (
          <li key={row.key} className="inline-flex items-center gap-1">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            {row.label}: {formatAnalyticsNumber(row.count, language)} (
            {formatAnalyticsPercent(row.percent, language)})
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export function DistributionCharts({
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
  const courseNames = new Map(
    data.courseOptions.map((course) => [course.id, course.title[language]]),
  );
  const courseRows = data.distributions.courses.map((item) => ({
    ...item,
    key: item.key === 'other' ? item.key : (courseNames.get(item.key) ?? item.key),
  }));
  return (
    <>
      <Donut
        title={t('paymentDistribution')}
        definition={t('definitions.cohort')}
        rows={data.distributions.paymentStatus}
        name="paymentStatuses"
        language={language}
        loading={loading}
        error={error}
        retry={retry}
      />
      <Donut
        title={t('followUpDistribution')}
        definition={t('definitions.currentFollowUp')}
        rows={data.distributions.followUp}
        name="followUpStatuses"
        language={language}
        loading={loading}
        error={error}
        retry={retry}
      />
      <Donut
        title={t('enrollmentsByCourse')}
        definition={t('definitions.topCourses')}
        rows={courseRows}
        name="courseNames"
        language={language}
        loading={loading}
        error={error}
        retry={retry}
      />
    </>
  );
}
