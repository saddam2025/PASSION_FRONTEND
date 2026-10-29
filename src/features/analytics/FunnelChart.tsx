import type { AnalyticsResult } from '@/lib/analytics';
import type { AppLanguage } from '@/i18n';
import { formatAnalyticsNumber, formatAnalyticsPercent } from '@/lib/analytics/format';
import { ChartCard } from './ChartCard';
import { useChartNames } from './chartUtils';

export function FunnelChart({
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
  return (
    <ChartCard
      title={t('funnel')}
      definition={t('definitions.funnel')}
      loading={loading}
      error={error}
      onRetry={retry}
      empty={!data.funnel[0]?.count}
      ariaLabel={t('funnel')}
      tableHeaders={[t('stage'), t('count'), t('dropOff'), t('dropOffPercent')]}
      tableRows={data.funnel.map((stage) => ({
        cells: [
          t(`stages.${stage.key}`),
          stage.count,
          stage.dropOff,
          stage.dropOffPercent === null ? '—' : `${Math.round(stage.dropOffPercent * 100)}%`,
        ],
      }))}
    >
      <div
        role="img"
        aria-label={`${t('funnel')}: ${formatAnalyticsNumber(data.funnel[0]?.count ?? 0, language)}`}
        className="grid content-center gap-4 py-4"
        dir="auto"
      >
        {data.funnel.map((stage, index) => (
          <div key={stage.key} className="grid gap-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <strong>{t(`stages.${stage.key}`)}</strong>
              <span>
                {formatAnalyticsNumber(stage.count, language)} ·{' '}
                {formatAnalyticsPercent(
                  data.funnel[0].count ? stage.count / data.funnel[0].count : 0,
                  language,
                )}
              </span>
              {index > 0 && (
                <small className="text-muted">
                  {t('dropOff')}: {formatAnalyticsNumber(stage.dropOff, language)} (
                  {stage.dropOffPercent === null
                    ? formatAnalyticsPercent(0, language)
                    : formatAnalyticsPercent(stage.dropOffPercent, language)}
                  )
                </small>
              )}
            </div>
            <div className="h-7 rounded-xs bg-canvas">
              <div
                className="h-full rounded-xs bg-[var(--chart-1)]"
                style={{
                  width: `${data.funnel[0].count ? (stage.count / data.funnel[0].count) * 100 : 0}%`,
                  marginInlineStart: 0,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
