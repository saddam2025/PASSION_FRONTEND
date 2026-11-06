import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Skeleton, EmptyState } from '@/components/ui/feedback';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/api/client';
import { overviewService, type OverviewData, type OverviewPeriod } from '@/services/overview';
import { formatMoneyMinor } from '@/lib/formatters';
import { clampFutureDate, last30Days, parseAppliedRange, presetRange, todayInCairo, validateRange, type AppliedRange } from './overviewRange';

const OverviewCharts = lazy(() => import('./OverviewCharts'));
const card = 'grid min-w-0 gap-2 rounded-sm border border-border bg-surface p-4';
const presets = ['7d', '30d', '90d', 'month', 'all'] as const;

function queryParts(range: AppliedRange): { period: OverviewPeriod; from?: string; to?: string } {
  return 'all' in range ? { period: 'all' } : { period: 'range', from: range.from, to: range.to };
}
function rangeKey(range: AppliedRange): string { return 'all' in range ? 'all' : `${range.from}:${range.to}`; }
function rangeParams(range: AppliedRange): URLSearchParams { return 'all' in range ? new URLSearchParams({ range: 'all' }) : new URLSearchParams({ from: range.from, to: range.to }); }

export default function OverviewPage() {
  const { t } = useTranslation('dashboard');
  const [searchParams, setSearchParams] = useSearchParams();
  const today = todayInCairo();
  const searchText = searchParams.toString();
  const parsed = useMemo(() => {
    const params = new URLSearchParams(searchText);
    return parseAppliedRange(params.get('from'), params.get('to'), today, params.get('range') === 'all');
  }, [searchText, today]);
  const applied = parsed.range;
  const [draftFrom, setDraftFrom] = useState(() => 'all' in parsed.range ? last30Days(today).from : parsed.range.from);
  const [draftTo, setDraftTo] = useState(() => 'all' in parsed.range ? today : parsed.range.to);
  const [futureHint, setFutureHint] = useState(false);
  const [urlNotice, setUrlNotice] = useState(parsed.invalid);
  const draftIssue = validateRange(draftFrom, draftTo, today);

  useEffect(() => {
    if (parsed.invalid) setUrlNotice(true);
    setDraftFrom('all' in parsed.range ? last30Days(today).from : parsed.range.from);
    setDraftTo('all' in parsed.range ? today : parsed.range.to);
    const canonical = rangeParams(parsed.range);
    if (searchText !== canonical.toString()) setSearchParams(canonical, { replace: true });
  }, [parsed, searchText, setSearchParams, today]);

  const result = useQuery({
    queryKey: ['admin-overview', rangeKey(applied)],
    queryFn: async ({ signal }) => {
      const query = queryParts(applied);
      const [overview, charts] = await Promise.allSettled([
        overviewService.get(query, signal),
        overviewService.getCharts('all' in applied ? {} : applied, signal),
      ]);
      if (overview.status === 'rejected') throw overview.reason;
      return {
        overview: overview.value,
        charts: charts.status === 'fulfilled' ? charts.value : undefined,
        chartsError: charts.status === 'rejected' ? charts.reason : undefined,
      };
    },
    placeholderData: (previous) => previous,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const applyRange = (range: AppliedRange) => {
    setUrlNotice(false);
    setFutureHint(false);
    if (!('all' in range)) { setDraftFrom(range.from); setDraftTo(range.to); }
    else { setDraftFrom(last30Days(today).from); setDraftTo(today); }
    setSearchParams(rangeParams(range), { replace: true });
  };
  const changeDate = (which: 'from' | 'to', value: string) => {
    const result = clampFutureDate(value, today);
    setFutureHint(result.clamped);
    if (which === 'from') setDraftFrom(result.value); else setDraftTo(result.value);
  };
  const apiError = result.error;
  const rangeError = apiError instanceof ApiError && apiError.code === 'INVALID_RANGE'
    ? t('charts.invalidRange')
    : apiError instanceof ApiError && apiError.code === 'RANGE_TOO_LARGE' ? t('charts.rangeTooLarge') : undefined;
  if (result.isPending && !result.data) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} variant="card" />)}</div>;

  return <main className="grid min-w-0 gap-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{t('nav.overview')}</h1><div className="flex flex-wrap gap-2" role="group" aria-label={t('charts.range')}>
      {presets.map((preset) => <Button key={preset} size="sm" variant={preset === 'all' ? 'outline' : 'outline'} aria-pressed={preset === 'all' ? 'all' in applied : !('all' in applied) && rangeKey(applied) === rangeKey(presetRange(preset, today))} onClick={() => applyRange(presetRange(preset, today))}>{t(`charts.presets.${preset}`)}</Button>)}
    </div></header>
    <section className="flex flex-wrap items-end gap-3 rounded-sm border border-border bg-surface p-3">
      <label className="grid gap-1 text-sm">{t('charts.from')}<input aria-label={t('charts.from')} type="date" value={draftFrom} max={today} onChange={(event) => changeDate('from', event.target.value)} className="min-h-10 rounded-xs border border-border bg-surface px-3" /></label>
      <label className="grid gap-1 text-sm">{t('charts.to')}<input aria-label={t('charts.to')} type="date" value={draftTo} max={today} onChange={(event) => changeDate('to', event.target.value)} className="min-h-10 rounded-xs border border-border bg-surface px-3" /></label>
      <Button disabled={draftIssue !== null} onClick={() => applyRange({ from: draftFrom, to: draftTo })}>{t('charts.apply')}</Button>
      <div className="basis-full" aria-live="polite">
        {draftIssue && draftIssue !== 'incomplete' && <p className="text-sm text-danger">{t(`charts.validation.${draftIssue}`)}</p>}
        {draftIssue === 'incomplete' && <p className="text-sm text-muted">{t('charts.validation.incomplete')}</p>}
        {futureHint && <p className="text-sm text-muted">{t('charts.validation.futureClamped')}</p>}
        {urlNotice && <p className="text-sm text-muted">{t('charts.invalidUrl')}</p>}
      </div>
    </section>
    {result.isFetching && <p className="text-sm text-muted" role="status">{t('charts.refreshing')}</p>}
    {rangeError && <div className="rounded-sm border border-danger/40 bg-surface p-3 text-danger" role="alert">{rangeError}</div>}
    {apiError && !rangeError && <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-danger/40 bg-surface p-3" role="alert"><span>{t('charts.overviewError')}</span><Button variant="outline" onClick={() => void result.refetch()}>{t('charts.retry')}</Button></div>}
    {result.data && <>
      <OverviewPageContent data={result.data.overview} showCourses={false} />
      <Suspense fallback={<section className="rounded-sm border border-border bg-surface p-4"><Skeleton variant="card" /></section>}>
        <OverviewCharts data={result.data.charts} error={result.data.chartsError ? t('charts.unavailable') : undefined} retry={() => void result.refetch()} />
      </Suspense>
      <OverviewCoursesTable data={result.data.overview} />
    </>}
  </main>;
}

export function OverviewPageContent({ data, showCourses = true }: { data: OverviewData; showCourses?: boolean }) {
  const { t } = useTranslation('dashboard');
  return <div className="grid gap-3">
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[t('charts.totalRegistrations'), data.totalRegistrations], [t('charts.registrations'), data.registrations], [t('charts.paid'), data.paid], [t('charts.unpaid'), data.unpaid]].map(([label, value]) => <article key={label} className={card}><span className="text-sm text-muted">{label}</span><strong className="text-3xl tabular-nums">{value}</strong></article>)}{data.revenueByCurrency.map((item) => <article key={item.currency} className={card}><span className="text-sm text-muted">{item.currency === 'USD' ? t('charts.revenueUsd') : t('charts.revenueEgp')}</span><strong className="text-3xl tabular-nums">{formatMoneyMinor(item.netRevenue, item.currency)}</strong></article>)}</section>
    <p className="text-sm text-muted">{t('currencyRevenueSeparate')}</p>
    {showCourses && <OverviewCoursesTable data={data} />}
  </div>;
}

export function OverviewCoursesTable({ data }: { data: OverviewData }) {
  const { t } = useTranslation('dashboard');
  const currencies = [...new Set(data.revenueByCurrency.map((item) => item.currency))];
  return <section className="grid min-w-0 gap-3 rounded-sm border border-border bg-surface p-4"><h2 className="font-bold">{t('charts.byCourse')}</h2>{data.courses.length ? <div className="overflow-x-auto"><table className="w-full min-w-[38rem] text-start text-sm"><thead><tr className="border-b border-border text-muted"><th className="p-2 text-start">{t('charts.course')}</th><th className="p-2 text-start">{t('charts.registrations')}</th><th className="p-2 text-start">{t('charts.paid')}</th>{currencies.map((currency) => <th key={currency} className="p-2 text-start">{currency === 'USD' ? t('charts.revenueUsd') : t('charts.revenueEgp')}</th>)}</tr></thead><tbody>{data.courses.map((course) => <tr key={course.id} className="border-b border-border last:border-0"><td className="p-2">{course.title}</td><td className="p-2 tabular-nums">{course.registrations}</td><td className="p-2 tabular-nums">{course.paid}</td>{currencies.map((currency) => <td key={currency} className="p-2 tabular-nums">{formatMoneyMinor(course.netByCurrency[currency], currency)}</td>)}</tr>)}</tbody></table></div> : <EmptyState title={t('charts.empty')} />}</section>;
}
