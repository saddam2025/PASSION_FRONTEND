import { Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoneyMinor, formatNumber } from '@/lib/formatters';
import { ACADEMY_TIME_ZONE } from '@/lib/timezone';
import type { OverviewChartsData } from '@/services/overview';

const colors = ['#075985', '#0e7490', '#2563eb', '#4f46e5', '#0f766e', '#64748b'];
const statusKeys = ['unpaid', 'partially_paid', 'paid', 'refunded', 'partially_refunded', 'cancelled'];

export class ChartErrorBoundary extends Component<{ title: string; retryLabel: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div role="alert" className="grid min-h-40 place-content-center gap-3 text-center"><p>{this.props.title}</p><button className="text-primary underline" onClick={() => this.setState({ failed: false })}>{this.props.retryLabel}</button></div>;
    return this.props.children;
  }
}

function dateLabel(bucket: string, granularity: OverviewChartsData['range']['granularity']): string {
  const date = new Date(`${bucket}T12:00:00Z`);
  const options: Intl.DateTimeFormatOptions = granularity === 'month' ? { month: 'short', year: '2-digit' } : granularity === 'week' ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' };
  return new Intl.DateTimeFormat('ar-EG-u-nu-latn', { ...options, timeZone: ACADEMY_TIME_ZONE, numberingSystem: 'latn' }).format(date);
}

function ChartCard({ title, children, retryLabel, summary }: { title: string; children: ReactNode; retryLabel: string; summary?: string }) {
  return <section className="grid min-w-0 gap-3 rounded-sm border border-border bg-surface p-4" aria-label={title}>
    <h2 className="font-bold">{title}</h2>
    <ChartErrorBoundary title={title} retryLabel={retryLabel}>{children}</ChartErrorBoundary>
    {summary && <p className="sr-only">{summary}</p>}
  </section>;
}

function HiddenTable({ title, headers, rows }: { title: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return <table className="sr-only"><caption>{title}</caption><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table>;
}

function EmptyChart() { const { t } = useTranslation('dashboard'); return <p className="grid min-h-48 place-content-center text-center text-muted">{t('charts.empty')}</p>; }

function RegistrationsChart({ data }: { data: OverviewChartsData }) {
  const { t } = useTranslation('dashboard');
  const series = [...data.registrationsSeries].reverse().map((point) => ({ ...point, label: dateLabel(point.bucket, data.range.granularity) }));
  if (!series.some((point) => point.registrations || point.paid)) return <EmptyChart />;
  return <><div dir="ltr" className="h-64 min-w-0" role="img" aria-label={t('charts.registrationSummary')}><ResponsiveContainer width="100%" height="100%"><AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><defs><linearGradient id="registrationFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors[0]} stopOpacity={0.25} /><stop offset="100%" stopColor={colors[0]} stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #dbe3ed)" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip formatter={(value, name) => [formatNumber(Number(value), 0), name]} /><Legend wrapperStyle={{ direction: 'rtl' }} /><Area type="monotone" dataKey="registrations" name={t('charts.registrations')} stroke={colors[0]} fill="url(#registrationFill)" strokeWidth={2} /><Area type="monotone" dataKey="paid" name={t('charts.paid')} stroke={colors[2]} fill="transparent" strokeWidth={2} /></AreaChart></ResponsiveContainer></div><HiddenTable title={t('charts.registrationSummary')} headers={[t('charts.date'), t('charts.registrations'), t('charts.paid')]} rows={series.map((point) => [point.label, point.registrations, point.paid])} /></>;
}

function RevenueCharts({ data }: { data: OverviewChartsData }) {
  const { t } = useTranslation('dashboard');
  const revenue = [...data.revenueSeriesByCurrency].sort((a, b) => (a.currency === 'EGP' ? -1 : b.currency === 'EGP' ? 1 : 0));
  if (!revenue.length) return <EmptyChart />;
  return <div className="grid gap-4 xl:grid-cols-2">{revenue.map((item) => {
    const points = [...item.series].reverse().map((point) => ({ ...point, label: dateLabel(point.bucket, data.range.granularity) }));
    const total = points.reduce((sum, point) => sum + point.netRevenue, 0);
    return <div key={item.currency} className="grid min-w-0 gap-2"><h3 className="font-semibold">{item.currency === 'EGP' ? t('charts.egp') : t('charts.usd')}</h3>{total === 0 ? <EmptyChart /> : <><div dir="ltr" className="h-56 min-w-0" role="img" aria-label={`${t('charts.revenue')} ${item.currency}`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={points}><defs><linearGradient id={`revenueFill-${item.currency}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={item.currency === 'EGP' ? colors[1] : colors[3]} stopOpacity={0.25} /><stop offset="100%" stopColor={item.currency === 'EGP' ? colors[1] : colors[3]} stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tickFormatter={(value) => formatMoneyMinor(Math.max(0, Math.round(Number(value))), item.currency)} tick={{ fontSize: 10 }} width={72} /><Tooltip formatter={(value) => formatMoneyMinor(Math.max(0, Math.round(Number(value))), item.currency)} /><Area type="monotone" dataKey="netRevenue" name={t('charts.netRevenue')} stroke={item.currency === 'EGP' ? colors[1] : colors[3]} fill={`url(#revenueFill-${item.currency})`} strokeWidth={2} /></AreaChart></ResponsiveContainer></div><HiddenTable title={`${t('charts.revenue')} ${item.currency}`} headers={[t('charts.date'), t('charts.netRevenue')]} rows={points.map((point) => [point.label, formatMoneyMinor(point.netRevenue, item.currency)])} /></>}</div>;
  })}</div>;
}

export function buildFunnelStages(funnel: OverviewChartsData['funnel'], labels: string[]) {
  const values = [funnel.registered, funnel.contacted, funnel.awaitingPayment, funnel.paid].map((value) => Math.max(0, value));
  return values.map((count, index) => ({ label: labels[index]!, count, percent: values[0] ? Math.round(count / values[0] * 100) : 0, drop: index > 0 && values[index - 1] ? Math.round((values[index - 1]! - count) / values[index - 1]! * 100) : 0, width: values[0] ? count / values[0] * 100 : 0 }));
}

function FunnelChart({ funnel }: { funnel: OverviewChartsData['funnel'] }) {
  const { t } = useTranslation('dashboard');
  const labels = [t('charts.registered'), t('charts.contacted'), t('charts.awaiting'), t('charts.paid')];
  const stages = buildFunnelStages(funnel, labels);
  return <div className="grid gap-3" aria-label={t('charts.funnel')}><p className="text-sm text-muted">{t('charts.funnelCaption')}</p>{stages.map((stage, index) => <div key={stage.label} className="grid gap-1"><div className="flex justify-between gap-2 text-sm"><strong>{stage.label}</strong><span>{formatNumber(stage.count, 0)} · {stage.percent}%{index > 0 ? ` · ${t('charts.drop')} ${stage.drop}%` : ''}</span></div><div className="h-3 rounded-full bg-muted/20"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${stage.width}%` }} /></div></div>)}<p className="text-sm text-muted">{t('charts.cancelled')}: {formatNumber(funnel.cancelled, 0)}</p><HiddenTable title={t('charts.funnel')} headers={[t('charts.stage'), t('charts.count'), t('charts.percent'), t('charts.drop')]} rows={stages.map((stage) => [stage.label, stage.count, `${stage.percent}%`, `${stage.drop}%`])} /></div>;
}

function DistributionDonut({ title, rows }: { title: string; rows: Array<{ name: string; count: number }> }) {
  const { t } = useTranslation('dashboard');
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (!total) return <EmptyChart />;
  return <><div className="grid items-center gap-3 sm:grid-cols-[minmax(140px,1fr)_minmax(140px,1fr)]"><div dir="ltr" className="relative h-52 min-w-0" role="img" aria-label={title}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={rows} dataKey="count" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2}>{rows.map((row, index) => <Cell key={row.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value, name) => [`${formatNumber(Number(value), 0)} (${Math.round(Number(value) / total * 100)}%)`, name]} /></PieChart></ResponsiveContainer><span className="pointer-events-none absolute inset-0 grid place-content-center text-center text-xl font-bold">{formatNumber(total, 0)}</span></div><ul className="grid gap-2 text-sm">{rows.map((row, index) => <li key={row.name} className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2"><i aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />{row.name}</span><span className="shrink-0 tabular-nums">{formatNumber(row.count, 0)} · {Math.round(row.count / total * 100)}%</span></li>)}</ul></div><HiddenTable title={title} headers={[title, t('charts.count'), t('charts.percent')]} rows={rows.map((row) => [row.name, row.count, `${Math.round(row.count / total * 100)}%`])} /></>;
}

function ChartsError({ message, retry }: { message: string; retry: () => void }) { const { t } = useTranslation('dashboard'); return <div className="grid min-h-40 place-content-center gap-2 text-center" role="alert"><p>{message}</p><button className="text-primary underline" onClick={retry}>{t('charts.retry')}</button></div>; }

export default function OverviewCharts({ data, error, retry }: { data?: OverviewChartsData; error?: string; retry: () => void }) {
  const { t } = useTranslation('dashboard');
  if (error || !data) return <section className="rounded-sm border border-border bg-surface p-4"><ChartsError message={error || t('charts.unavailable')} retry={retry} /></section>;
  const statuses = statusKeys.map((status) => ({ name: t(`charts.status.${status}`), count: data.paymentStatusDistribution.find((row) => row.status === status)?.count ?? 0 }));
  const courses = data.byCourse.map((item) => ({ name: item.courseId === null ? t('charts.otherCourses') : item.title, count: item.registrations }));
  const audience = data.byAudience?.map((item) => ({ name: item.audience === 'egyptian' ? t('charts.egyptians') : t('charts.foreigners'), count: item.registrations }));
  return <div className="grid min-w-0 gap-4">
    <ChartCard title={t('charts.registrationsTitle')} retryLabel={t('charts.retry')} summary={t('charts.registrationSummary')}><RegistrationsChart data={data} /></ChartCard>
    <ChartCard title={t('charts.revenue')} retryLabel={t('charts.retry')}><p className="mb-3 text-sm text-muted">{t('currencyRevenueSeparate')}</p><RevenueCharts data={data} /></ChartCard>
    <div className="grid min-w-0 gap-4 xl:grid-cols-2"><ChartCard title={t('charts.funnel')} retryLabel={t('charts.retry')}><FunnelChart funnel={data.funnel} /></ChartCard><ChartCard title={t('charts.paymentStatus')} retryLabel={t('charts.retry')}><DistributionDonut title={t('charts.paymentStatus')} rows={statuses} /></ChartCard></div>
    <div className="grid min-w-0 gap-4 xl:grid-cols-2"><ChartCard title={t('charts.byCourse')} retryLabel={t('charts.retry')}><DistributionDonut title={t('charts.byCourse')} rows={courses} /></ChartCard>{audience && <ChartCard title={t('charts.byAudience')} retryLabel={t('charts.retry')}><DistributionDonut title={t('charts.byAudience')} rows={audience} /></ChartCard>}</div>
  </div>;
}
