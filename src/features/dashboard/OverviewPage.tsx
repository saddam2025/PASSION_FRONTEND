import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ErrorState, Skeleton, EmptyState } from '@/components/ui/feedback';
import { overviewService, type OverviewData, type OverviewPeriod } from '@/services/overview';
import { Button } from '@/components/ui/Button';
import { formatMoney } from '@/lib/formatters';
import { academyDateKey, addCalendarDays } from '@/lib/timezone';

const card = 'grid gap-2 rounded-sm border border-border bg-surface p-4';
export default function OverviewPage() {
  const [period, setPeriod] = useState<OverviewPeriod>('30d');
  const today = academyDateKey(new Date());
  const [from, setFrom] = useState(addCalendarDays(today, -29));
  const [to, setTo] = useState(today);
  const result = useQuery({ queryKey: ['admin-overview', period, from, to], queryFn: () => overviewService.get({ period, from, to }) });
  if (result.isPending) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} variant="card" />)}</div>;
  if (result.isError || !result.data) return <ErrorState title="حصلت مشكلة في تحميل الملخص، جرّب تاني." onRetry={() => void result.refetch()} />;
  return <OverviewPageContent data={result.data} period={period} setPeriod={setPeriod} from={from} to={to} setFrom={setFrom} setTo={setTo} />;
}

export function OverviewPageContent({ data, period = '30d', setPeriod, from, to, setFrom, setTo }: {
  data: OverviewData;
  period?: OverviewPeriod;
  setPeriod?: (period: OverviewPeriod) => void;
  from?: string; to?: string;
  setFrom?: (value: string) => void; setTo?: (value: string) => void;
}) {
  const { t } = useTranslation('dashboard');
  const options: Array<{ id: OverviewPeriod; label: string }> = [{ id: '7d', label: 'آخر ٧ أيام' }, { id: '30d', label: 'آخر ٣٠ يوم' }, { id: 'all', label: 'كل الفترات' }, { id: 'range', label: 'فترة محددة' }];
  return <main className="grid gap-5"><header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{t('nav.overview')}</h1><div className="flex flex-wrap gap-2" role="group" aria-label="الفترة الزمنية">{options.map((item) => <Button key={item.id} size="sm" variant={period === item.id ? 'primary' : 'outline'} aria-pressed={period === item.id} onClick={() => setPeriod?.(item.id)}>{item.label}</Button>)}</div></header>
    {period === 'range' && <div className="flex flex-wrap items-end gap-3 rounded-sm border border-border bg-surface p-3"><label className="grid gap-1 text-sm">من<input type="date" value={from ?? ''} onChange={(event) => setFrom?.(event.target.value)} className="min-h-10 rounded-xs border border-border px-3" /></label><label className="grid gap-1 text-sm">إلى<input type="date" value={to ?? ''} onChange={(event) => setTo?.(event.target.value)} className="min-h-10 rounded-xs border border-border px-3" /></label></div>}
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[['إجمالي التسجيلات', data.totalRegistrations], ['التسجيلات في الفترة', data.registrations], ['مدفوع', data.paid], ['غير مدفوع', data.unpaid]].map(([label, value]) => <article key={label} className={card}><span className="text-sm text-muted">{label}</span><strong className="text-3xl tabular-nums">{value}</strong></article>)}<article className={card}><span className="text-sm text-muted">صافي الإيرادات في الفترة</span><strong className="text-3xl tabular-nums">{formatMoney(data.netRevenue, 'EGP')}</strong></article></section>
    <section className="grid gap-3 rounded-sm border border-border bg-surface p-4"><h2 className="font-bold">التسجيلات حسب الكورس</h2>{data.courses.length ? <div className="overflow-x-auto"><table className="w-full min-w-[34rem] text-start text-sm"><thead><tr className="border-b border-border text-muted"><th className="p-2 text-start">الكورس</th><th className="p-2 text-start">التسجيلات</th><th className="p-2 text-start">مدفوع</th><th className="p-2 text-start">الإيرادات</th></tr></thead><tbody>{data.courses.map((course) => <tr key={course.id} className="border-b border-border last:border-0"><td className="p-2">{course.title}</td><td className="p-2 tabular-nums">{course.registrations}</td><td className="p-2 tabular-nums">{course.paid}</td><td className="p-2 tabular-nums">{formatMoney(course.revenue, course.currency)}</td></tr>)}</tbody></table></div> : <EmptyState title="مفيش تسجيلات في الفترة دي." />}</section>
  </main>;
}
