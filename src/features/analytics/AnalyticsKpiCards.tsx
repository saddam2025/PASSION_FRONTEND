import { useTranslation } from 'react-i18next';
import type { AnalyticsResult } from '@/lib/analytics';
import type { AppLanguage } from '@/i18n';
import {
  formatAnalyticsMoney,
  formatAnalyticsNumber,
  formatAnalyticsPercent,
} from '@/lib/analytics/format';
import { Skeleton } from '@/components/ui/feedback';

export function AnalyticsKpiCards({
  data,
  language,
  currency,
  loading,
}: {
  data?: AnalyticsResult;
  language: AppLanguage;
  currency: string;
  loading: boolean;
}) {
  const { t } = useTranslation('analytics');
  const current = data?.kpis;
  const previous = data?.compare?.kpis;
  const values: Array<{
    key: string;
    value: string;
    previous?: number;
    amount?: number;
    hint?: string;
  }> = [
    {
      key: 'publishedCourses',
      value: formatAnalyticsNumber(current?.publishedCourses ?? 0, language),
      previous: previous?.publishedCourses,
      hint: 'currentState',
    },
    {
      key: 'draftCourses',
      value: formatAnalyticsNumber(current?.draftCourses ?? 0, language),
      previous: previous?.draftCourses,
      hint: 'currentState',
    },
    {
      key: 'pendingRevisions',
      value: formatAnalyticsNumber(current?.pendingRevisions ?? 0, language),
      previous: previous?.pendingRevisions,
      hint: 'currentState',
    },
    {
      key: 'newLeads',
      value: formatAnalyticsNumber(current?.newLeads ?? 0, language),
      previous: previous?.newLeads,
    },
    {
      key: 'uniqueCustomers',
      value: formatAnalyticsNumber(current?.uniqueCustomers ?? 0, language),
      previous: previous?.uniqueCustomers,
    },
    {
      key: 'enrollments',
      value: formatAnalyticsNumber(current?.enrollments ?? 0, language),
      previous: previous?.enrollments,
    },
    {
      key: 'paidEnrollments',
      value: formatAnalyticsNumber(current?.paidEnrollments ?? 0, language),
      previous: previous?.paidEnrollments,
    },
    {
      key: 'partiallyPaid',
      value: formatAnalyticsNumber(current?.partiallyPaid ?? 0, language),
      previous: previous?.partiallyPaid,
    },
    {
      key: 'unpaid',
      value: formatAnalyticsNumber(current?.unpaid ?? 0, language),
      previous: previous?.unpaid,
    },
    {
      key: 'netRevenue',
      value: formatAnalyticsMoney(current?.netRevenue[currency] ?? 0, currency, language),
      amount: previous?.netRevenue[currency],
    },
    {
      key: 'refunds',
      value: formatAnalyticsMoney(current?.refunds[currency] ?? 0, currency, language),
      amount: previous?.refunds[currency],
    },
    {
      key: 'outstanding',
      value: formatAnalyticsMoney(current?.outstanding[currency] ?? 0, currency, language),
      amount: previous?.outstanding[currency],
      hint: 'asOfNow',
    },
    {
      key: 'conversion',
      value:
        current?.conversion === null || !current
          ? '—'
          : formatAnalyticsPercent(current.conversion, language),
      previous:
        previous?.conversion === null
          ? undefined
          : previous?.conversion === undefined
            ? undefined
            : previous.conversion * 100,
      hint: current
        ? `${formatAnalyticsNumber(current.conversionNumerator, language)}/${formatAnalyticsNumber(current.conversionDenominator, language)}`
        : '0/0',
    },
  ];
  return (
    <section aria-label={t('kpis')} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {values.map((item) => {
        const oldValue = item.amount ?? item.previous;
        const newValue =
          item.key === 'conversion'
            ? (current?.conversion ?? 0) * 100
            : item.key === 'netRevenue'
              ? current?.netRevenue[currency]
              : item.key === 'refunds'
                ? current?.refunds[currency]
                : item.key === 'outstanding'
                  ? current?.outstanding[currency]
                  : Number(current?.[item.key as keyof typeof current] ?? 0);
        const delta =
          oldValue === undefined || newValue === undefined ? undefined : newValue - oldValue;
        const comparable = ![
          'publishedCourses',
          'draftCourses',
          'pendingRevisions',
          'outstanding',
        ].includes(item.key);
        const deltaValue =
          delta === undefined
            ? ''
            : ['netRevenue', 'refunds'].includes(item.key)
              ? formatAnalyticsMoney(Math.abs(delta), currency, language)
              : formatAnalyticsNumber(Math.abs(delta), language);
        const deltaText =
          delta === undefined || !comparable
            ? null
            : `${delta > 0 ? '↑' : delta < 0 ? '↓' : '→'} ${deltaValue} ${t('vsPrevious')}`;
        return (
          <article
            key={item.key}
            className="grid min-h-28 content-between gap-2 rounded-sm border border-border bg-surface p-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm text-muted">{t(`kpi.${item.key}`)}</h2>
              <span
                tabIndex={0}
                title={t(`definitions.kpi.${item.key}`)}
                aria-label={`${t('definition')}: ${t(`definitions.kpi.${item.key}`)}`}
                className="cursor-help text-xs text-primary-strong"
              >
                ⓘ
              </span>
            </div>
            {loading ? (
              <Skeleton variant="title" />
            ) : (
              <>
                <strong className="text-2xl font-bold tabular-nums">{item.value}</strong>
                <div className="flex flex-wrap gap-x-2 text-xs text-muted">
                  {item.hint && (
                    <span>{item.key === 'conversion' ? item.hint : t(`hints.${item.hint}`)}</span>
                  )}
                  {deltaText && <span>{deltaText}</span>}
                </div>
              </>
            )}
          </article>
        );
      })}
      {current?.recentCohortHint && (
        <p className="sm:col-span-2 xl:col-span-4 text-sm text-warning">{t('recentHint')}</p>
      )}
    </section>
  );
}
