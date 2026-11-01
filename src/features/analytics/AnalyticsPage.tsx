import { lazy, Suspense, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { useAuth } from '@/app/AuthContext';
import { hasPermission } from '@/schemas/permissions';
import { analyticsService } from '@/services/analytics';
import { academyDateKey, addCalendarDays } from '@/lib/timezone';
import { AnalyticsFilters } from './AnalyticsFilters';
import { defaultAnalyticsRange } from '@/lib/analytics/range';
import { AnalyticsKpiCards } from './AnalyticsKpiCards';
import { AnalyticsTables } from './AnalyticsTables';
import { useLanguage } from '@/i18n/useLanguage';
import { useToast } from '@/components/ui/feedback';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { ACADEMY_TIME_ZONE } from '@/lib/timezone';
import { formatDate } from '@/lib/formatters';
import { buildAnalyticsCsv } from './buildAnalyticsCsv';
import { analyticsBucketValues, isAnalyticsDate } from './pageFilters';

const AnalyticsCharts = lazy(() => import('./AnalyticsCharts'));
export default function AnalyticsPage() {
  const { t } = useTranslation('analytics');
  const { language } = useLanguage();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const toast = useToast();
  const canView = Boolean(user && hasPermission(user, 'viewFinancialReports'));
  const canExport = Boolean(user && hasPermission(user, 'exportCsv'));
  useDocumentTitle(t('title'));
  const defaults = defaultAnalyticsRange();
  const fromValue = params.get('from') ?? defaults.from;
  const toValue = params.get('to') ?? defaults.to;
  const dateValid = isAnalyticsDate(fromValue) && isAnalyticsDate(toValue) && fromValue <= toValue;
  const from = dateValid ? fromValue : defaults.from;
  const to = dateValid ? toValue : defaults.to;
  const bucketParam = params.get('bucket');
  const bucket = analyticsBucketValues.includes(bucketParam as (typeof analyticsBucketValues)[number])
    ? (bucketParam as (typeof analyticsBucketValues)[number])
    : undefined;
  const requestedCurrency = params.get('currency');
  const currency =
    requestedCurrency && ['EGP', 'USD', 'SAR', 'AED', 'EUR'].includes(requestedCurrency)
      ? requestedCurrency
      : undefined;
  const analyticsQuery = useMemo(
    () => ({
      from,
      to,
      courseId: params.get('course') ?? undefined,
      currency,
      bucket,
      compare: params.get('compare') === '1',
    }),
    [from, to, params, bucket, currency],
  );
  const query = useQuery({
    queryKey: ['analytics', analyticsQuery],
    enabled: canView,
    queryFn: () => analyticsService.query(analyticsQuery),
    retry: 1,
  });
  const generate = useMutation({
    mutationFn: async () => {
      if (!import.meta.env.DEV) throw new Error('Development only.');
      const demo = await import('@/mocks/analyticsDemo.mock');
      return demo.generateAnalyticsDemo();
    },
    onSuccess: async () => {
      const end = academyDateKey(new Date());
      const next = new URLSearchParams(params);
      next.set('from', addCalendarDays(end, -89));
      next.set('to', end);
      setParams(next);
      await client.invalidateQueries({ queryKey: ['analytics'] });
      toast.notify({ title: t('demoGenerated'), tone: 'success' });
    },
    onError: () => toast.notify({ title: t('sectionError'), tone: 'danger' }),
  });
  const clear = useMutation({
    mutationFn: async () => {
      if (!import.meta.env.DEV) return;
      const demo = await import('@/mocks/analyticsDemo.mock');
      demo.clearAnalyticsDemo();
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['analytics'] });
      toast.notify({ title: t('demoCleared'), tone: 'success' });
    },
    onError: () => toast.notify({ title: t('sectionError'), tone: 'danger' }),
  });
  const data = query.data;
  const displayCurrency = currency ?? data?.defaultCurrency ?? 'EGP';
  const exportSummary = async () => {
    if (!data || !canExport) return;
    try {
      await analyticsService.auditExport();
      const csv = buildAnalyticsCsv(data, {
        from,
        to,
        bucket,
        currency: displayCurrency,
        language,
        t,
      });
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'analytics-summary.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.notify({ title: t('exportDone'), tone: 'success' });
    } catch {
      toast.notify({ title: t('exportError'), tone: 'danger' });
    }
  };
  if (!canView)
    return (
      <section className="grid gap-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <ErrorState title={t('forbidden')} />
      </section>
    );
  if (query.isError && !data)
    return (
      <section className="grid gap-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <ErrorState title={t('loadError')} onRetry={() => void query.refetch()} />
      </section>
    );
  return (
    <section className="grid gap-5">
      {data?.hasDemoData && import.meta.env.DEV && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-warning/40 bg-warning/10 p-3 font-bold text-warning"
        >
          {t('demoRibbon')}
          <Button variant="secondary" disabled={clear.isPending} onClick={() => clear.mutate()}>
            {t('clearDemo')}
          </Button>
        </div>
      )}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted">
            {t('lastUpdated')}:{' '}
            {query.dataUpdatedAt
              ? formatDate(query.dataUpdatedAt, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: ACADEMY_TIME_ZONE,
                })
              : '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {query.isFetching ? t('refreshing') : t('refresh')}
          </Button>
          {canExport && (
            <Button onClick={() => void exportSummary()} disabled={!data}>
              {t('exportSummary')}
            </Button>
          )}
        </div>
      </header>
      <AnalyticsFilters data={data} language={language} />
      <AnalyticsKpiCards
        data={data}
        language={language}
        currency={displayCurrency}
        loading={query.isPending}
      />
      {query.isError && data && (
        <p role="alert" className="rounded-xs border border-warning/30 bg-warning/5 p-3 text-sm">
          {t('staleData')}
        </p>
      )}
      {import.meta.env.DEV && data && !data.kpis.enrollments && (
        <EmptyState
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button disabled={generate.isPending} onClick={() => generate.mutate()}>
              {generate.isPending ? t('generating') : t('generateDemo')}
            </Button>
          }
        />
      )}
      {query.isPending && !data ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : (
        data && (
          <>
            <Suspense
              fallback={
                <div className="grid gap-4 xl:grid-cols-2">
                  <Skeleton variant="card" />
                  <Skeleton variant="card" />
                </div>
              }
            >
              <AnalyticsCharts
                data={data}
                currency={displayCurrency}
                language={language}
                loading={query.isFetching}
                error={query.isError}
                retry={() => void query.refetch()}
              />
            </Suspense>
            <AnalyticsTables data={data} currency={displayCurrency} language={language} />
          </>
        )
      )}
    </section>
  );
}
