import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import type { AnalyticsResult } from '@/lib/analytics';
import type { AppLanguage } from '@/i18n';
import {
  formatAnalyticsMoney,
  formatAnalyticsNumber,
  formatBucketLabel,
} from '@/lib/analytics/format';
import { ChartCard } from './ChartCard';
import { chartColors, reducedMotion, useChartNames } from './chartUtils';

export function RevenueChart({
  data,
  currency,
  language,
  loading,
  error,
  retry,
}: {
  data: AnalyticsResult;
  currency: string;
  language: AppLanguage;
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const t = useChartNames();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const bucket = data.query.bucket ?? 'day';
  const points = data.timeSeries.map((point) => ({
    label: formatBucketLabel(point.key, bucket, language),
    collected: (point.collected[currency] ?? 0) / 100,
    refunds: (point.refunds[currency] ?? 0) / 100,
    net: (point.net[currency] ?? 0) / 100,
  }));
  return (
    <ChartCard
      title={t('revenue')}
      subtitle={t('currencyHint', { currency })}
      definition={t('definitions.cash')}
      loading={loading}
      error={error}
      onRetry={retry}
      empty={!points.some((point) => point.net || point.collected || point.refunds)}
      ariaLabel={t('revenue')}
      tableHeaders={[t('date'), t('collected'), t('refunds'), t('netRevenue')]}
      tableRows={points.map((point) => ({
        cells: [
          point.label,
          formatAnalyticsMoney(point.collected * 100, currency, language),
          formatAnalyticsMoney(point.refunds * 100, currency, language),
          formatAnalyticsMoney(point.net * 100, currency, language),
        ],
      }))}
    >
      <div className="grid gap-2">
        <Button
          variant="secondary"
          className="justify-self-start"
          aria-pressed={showBreakdown}
          onClick={() => setShowBreakdown((value) => !value)}
        >
          {showBreakdown ? t('showNet') : t('showCollectedRefunds')}
        </Button>
        <div role="img" aria-label={t('revenue')} dir="ltr">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={points}>
              <defs>
                <pattern
                  id="netPattern"
                  width="8"
                  height="8"
                  patternTransform="rotate(45)"
                  patternUnits="userSpaceOnUse"
                >
                  <line x1="0" y1="0" x2="0" y2="8" stroke="var(--chart-1)" strokeWidth="3" />
                </pattern>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis tickFormatter={(value: number) => formatAnalyticsNumber(value, language)} />
              <Tooltip
                wrapperStyle={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
                formatter={(value: unknown) =>
                  formatAnalyticsMoney(Number(value) * 100, currency, language)
                }
              />
              {showBreakdown ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="collected"
                    name={t('collected')}
                    stroke={chartColors[1]}
                    fill="none"
                    isAnimationActive={!reducedMotion()}
                  />
                  <Area
                    type="monotone"
                    dataKey="refunds"
                    name={t('refunds')}
                    stroke={chartColors[2]}
                    fill="none"
                    isAnimationActive={!reducedMotion()}
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="net"
                  name={t('netRevenue')}
                  stroke={chartColors[0]}
                  fill="url(#netPattern)"
                  isAnimationActive={!reducedMotion()}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex flex-wrap gap-3 text-xs" aria-label={t('chartLegend')}>
          {showBreakdown ? (
            <>
              <li className="inline-flex items-center gap-1">
                <span aria-hidden="true" className="size-2 rounded-full bg-[var(--chart-2)]" />
                {t('collected')}
              </li>
              <li className="inline-flex items-center gap-1">
                <span aria-hidden="true" className="size-2 rounded-full bg-[var(--chart-3)]" />
                {t('refunds')}
              </li>
            </>
          ) : (
            <li className="inline-flex items-center gap-1">
              <span aria-hidden="true" className="size-2 rounded-full bg-[var(--chart-1)]" />
              {t('netRevenue')}
            </li>
          )}
        </ul>
      </div>
    </ChartCard>
  );
}
