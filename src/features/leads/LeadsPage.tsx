import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/AuthContext';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { useLanguage } from '@/i18n/useLanguage';
import { hasPermission } from '@/schemas/permissions';
import { leadsService } from '@/services/leads.service';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { formatDate, formatMoneyMinor } from '@/lib/formatters';
import { academyDateKey, addCalendarDays } from '@/lib/timezone';

const statuses = [
  'new',
  'contacted',
  'interested',
  'awaiting_payment',
  'no_answer',
  'not_interested',
  'closed',
] as const;
export default function LeadsPage() {
  const { t } = useTranslation('leads');
  const { language } = useLanguage();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const queryString = params.toString();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const page = Number(params.get('page') ?? 1);
  useEffect(() => {
    if (hash === '#lead-search') searchInputRef.current?.focus();
  }, [hash]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(queryString);
      if (search) next.set('search', search);
      else next.delete('search');
      next.delete('page');
      setParams(next, { replace: true });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, queryString, setParams]);
  const query = useQuery({
    queryKey: ['leads', params.toString()],
    queryFn: () =>
      leadsService.list({
        search: params.get('search') ?? '',
        page,
        pageSize: Number(params.get('size') ?? 25),
        courseId: params.get('course') ?? undefined,
        followUpStatus: (params.get('followUp') ?? undefined) as
          | (typeof statuses)[number]
          | undefined,
        enrollmentStatus: (params.get('enrollment') ?? undefined) as
          | 'pending'
          | 'confirmed'
          | 'cancelled'
          | undefined,
        paymentStatus: params.get('payment') ?? undefined,
        audience: (params.get('audience') ?? undefined) as 'egyptian' | 'foreign' | undefined,
        assigned: (params.get('assigned') ?? undefined) as 'me' | 'unassigned' | undefined,
        dateFrom: params.get('from') ?? undefined,
        dateTo: params.get('to') ?? undefined,
        sort: (params.get('sort') ?? 'newest') as 'newest' | 'oldest' | 'name' | 'course',
        actorRole: user?.role,
      }),
  });
  type ListData = Awaited<ReturnType<typeof leadsService.list>>;
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: (typeof statuses)[number] }) =>
      leadsService.updateFollowUp(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      const previous = queryClient.getQueriesData<ListData>({ queryKey: ['leads'] });
      queryClient.setQueriesData<ListData>({ queryKey: ['leads'] }, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === id ? { ...item, followUpStatus: status } : item,
              ),
            }
          : current,
      );
      return { previous };
    },
    onError: (_error, _variables, context) =>
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });
  const allowed = Boolean(user && hasPermission(user, 'updateFollowUp'));
  const canExport = Boolean(user && hasPermission(user, 'exportCsv'));
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };
  const setDatePreset = (preset: string) => {
    const today = new Date();
    const end = academyDateKey(today);
    let start = end;
    if (preset === '7days') start = addCalendarDays(end, -6);
    if (preset === '30days') start = addCalendarDays(end, -29);
    if (preset === 'thisMonth') start = `${end.slice(0, 8)}01`;
    const next = new URLSearchParams(params);
    if (preset === 'custom') {
      next.delete('from');
      next.delete('to');
    } else {
      next.set('from', start);
      next.set('to', end);
    }
    next.delete('page');
    setParams(next);
  };
  const exportRows = async () => {
    try {
      const records = await leadsService.exportCsv({
        search: params.get('search') ?? '',
        courseId: params.get('course') ?? undefined,
        followUpStatus: (params.get('followUp') ?? undefined) as
          | (typeof statuses)[number]
          | undefined,
        enrollmentStatus: (params.get('enrollment') ?? undefined) as
          | 'pending'
          | 'confirmed'
          | 'cancelled'
          | undefined,
        paymentStatus: params.get('payment') ?? undefined,
        audience: (params.get('audience') ?? undefined) as 'egyptian' | 'foreign' | undefined,
        assigned: (params.get('assigned') ?? undefined) as 'me' | 'unassigned' | undefined,
        dateFrom: params.get('from') ?? undefined,
        dateTo: params.get('to') ?? undefined,
        sort: (params.get('sort') ?? 'newest') as 'newest' | 'oldest' | 'name' | 'course',
      });
      const url = URL.createObjectURL(records.blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = records.filename || 'registrations.csv'; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.notify({ title: t('exportReady'), tone: 'success' });
    } catch (error) {
      toast.notify({ title: error instanceof Error ? error.message : t('loadError'), tone: 'danger' });
    }
  };
  const paymentSummaryAvailable = (query.data as typeof query.data & { paymentSummaryAvailable?: boolean } | undefined)?.paymentSummaryAvailable;
  const showPaymentColumns = Boolean(user && hasPermission(user, 'viewPayments') && paymentSummaryAvailable === true);
  return (
    <main className="grid gap-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted">{t('results', { count: query.data?.total ?? 0 })}</p>
        </div>
        {canExport && (
          <Button variant="secondary" onClick={exportRows}>
            {t('export')}
          </Button>
        )}
      </header>
      <div className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_14rem]">
        <input
          id="lead-search"
          ref={searchInputRef}
          className="min-h-11 rounded-xs border border-border px-3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
        />
        <select
          className="min-h-11 rounded-xs border border-border px-3"
          value={params.get('followUp') ?? ''}
          onChange={(e) => setFilter('followUp', e.target.value)}
          aria-label={t('followUp')}
        >
          <option value="">{t('allFollowUp')}</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {t(`followUpStatuses.${status}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <select className="min-h-11 rounded-xs border px-3" value={params.get('audience') ?? ''} onChange={(e) => setFilter('audience', e.target.value)} aria-label={t('audience')}>
          <option value="">{t('allAudiences')}</option><option value="egyptian">{t('egyptianAudience')}</option><option value="foreign">{t('foreignAudience')}</option>
        </select>
        <select
          className="min-h-11 rounded-xs border px-3"
          value={params.get('payment') ?? ''}
          onChange={(e) => setFilter('payment', e.target.value)}
          aria-label={t('payment')}
        >
          <option value="">{t('allPayments')}</option>
          {[
            'unpaid',
            'pending',
            'partially_paid',
            'paid',
            'failed',
            'cancelled',
            'refunded',
            'partially_refunded',
          ].map((x) => (
            <option key={x} value={x}>
              {t(`paymentStatuses.${x}`)}
            </option>
          ))}
        </select>
        <select
          className="min-h-11 rounded-xs border px-3"
          value={params.get('enrollment') ?? ''}
          onChange={(e) => setFilter('enrollment', e.target.value)}
          aria-label={t('enrollment')}
        >
          <option value="">{t('allEnrollments')}</option>
          {['pending', 'confirmed', 'cancelled'].map((x) => (
            <option key={x} value={x}>
              {t(`enrollmentStatuses.${x}`)}
            </option>
          ))}
        </select>
        {user?.role === 'admin' && <select
          className="min-h-11 rounded-xs border px-3"
          value={params.get('assigned') ?? ''}
          onChange={(e) => setFilter('assigned', e.target.value)}
          aria-label={t('assigned')}
        >
          <option value="">{t('anyone')}</option>
          <option value="me">{t('me')}</option>
          <option value="unassigned">{t('unassigned')}</option>
          {query.data?.users.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name[language]}
            </option>
          ))}
        </select>}
        <select
          className="min-h-11 rounded-xs border px-3"
          value={params.get('sort') ?? 'newest'}
          onChange={(e) => setFilter('sort', e.target.value)}
          aria-label={t('sort')}
        >
          <option value="newest">{t('newest')}</option>
          <option value="oldest">{t('oldest')}</option>
          <option value="name">{t('sortName')}</option>
          <option value="course">{t('sortCourse')}</option>
        </select>
        <select
          className="min-h-11 rounded-xs border px-3"
          value="custom"
          onChange={(e) => setDatePreset(e.target.value)}
          aria-label={t('dateRange')}
        >
          <option value="custom">{t('custom')}</option>
          <option value="today">{t('today')}</option>
          <option value="7days">{t('last7')}</option>
          <option value="30days">{t('last30')}</option>
          <option value="thisMonth">{t('thisMonth')}</option>
        </select>
        <DateRangePicker
          from={params.get('from') ?? ''}
          to={params.get('to') ?? ''}
          label={t('dateRange')}
          onChange={(from, to) => {
            const next = new URLSearchParams(params);
            next.set('from', from);
            next.set('to', to);
            setParams(next);
          }}
        />
      </div>
      {query.isLoading ? (
        <div className="grid gap-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : query.isError ? (
        <ErrorState title={t('loadError')} onRetry={() => void query.refetch()} />
      ) : !query.data?.items.length ? (
        <EmptyState title={t('empty')} />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-sm border border-border md:block">
            <table className="w-full text-start">
              <thead className="bg-canvas">
                <tr>
                  {[
                    'customer',
                    'email',
                    'phone',
                    'course',
                    'audience',
                    'audiencePrice',
                    'registered',
                    'enrollment',
                    ...(showPaymentColumns ? ['payment', 'netPaid'] : []),
                    'followUp',
                    ...(user?.role === 'admin' ? ['assignedTo'] : []),
                  ].map((key) => (
                    <th className="p-3" key={key}>
                      {t(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((enrollment) => {
                  const lead = enrollment.lead;
                  const status = (enrollment as typeof enrollment & { paymentSummary?: { status: string } }).paymentSummary?.status ?? '';
                  return (
                    <tr key={enrollment.id} className="border-t border-border">
                      <td className="p-3">
                        <Link
                          className="font-semibold text-primary-strong underline"
                          to={`${location.pathname}/${enrollment.id}?enrollment=${enrollment.id}`}
                        >
                          {lead?.fullName}
                        </Link>
                        <p className="text-xs text-muted" dir="ltr">
                          {enrollment.reference}
                        </p>
                      </td>
                      <td className="p-3" dir="ltr">
                        {lead?.email}
                      </td>
                      <td className="p-3" dir="ltr">
                        {lead?.phone}
                      </td>
                      <td className="p-3">{enrollment.courseSnapshot.title[language]}</td>
                      <td className="p-3">{t(enrollment.audience === 'foreign' ? 'foreignAudience' : 'egyptianAudience')}</td>
                      <td className="p-3">{enrollment.priceSnapshot.amount === null ? t('contactUs') : formatMoneyMinor(enrollment.priceSnapshot.amount, enrollment.priceSnapshot.currency === 'USD' ? 'USD' : 'EGP')}</td>
                      <td className="p-3" dir="ltr">
                        {formatDate(enrollment.registeredAt)}
                      </td>
                      <td className="p-3">
                        {t(`enrollmentStatuses.${enrollment.enrollmentStatus}`)}
                      </td>
                      {showPaymentColumns && <><td className="p-3">{t(`paymentStatuses.${status}`)}</td><td className="p-3">{formatMoneyMinor(minorNet(enrollment), enrollment.priceSnapshot.currency === 'USD' ? 'USD' : 'EGP')}</td></>}
                      <td className="p-3">
                        {allowed ? (
                          <select
                            className="min-h-11 rounded-xs border px-2"
                            value={enrollment.followUpStatus}
                            onChange={(e) =>
                              update.mutate({
                                id: enrollment.id,
                                status: e.target.value as (typeof statuses)[number],
                              })
                            }
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {t(`followUpStatuses.${s}`)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          t(`followUpStatuses.${enrollment.followUpStatus}`)
                        )}
                      </td>
                      {user?.role === 'admin' && <td className="p-3">
                        {query.data.users.find((member) => member.id === enrollment.assignedToUserId)?.name[language] ?? t('unassigned')}
                      </td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {query.data.items.map((enrollment) => {
              const lead = enrollment.lead;
              const status = (enrollment as typeof enrollment & { paymentSummary?: { status: string } }).paymentSummary?.status ?? '';
              return (
                <article
                  key={enrollment.id}
                  className="grid gap-2 rounded-sm border border-border bg-surface p-4"
                >
                  <Link
                  to={`${location.pathname}/${enrollment.id}?enrollment=${enrollment.id}`}
                    className="font-bold text-primary-strong underline"
                  >
                    {lead?.fullName}
                  </Link>
                  <p dir="ltr" className="text-start">
                    {lead?.email} · {lead?.phone}
                  </p>
                  <p>{enrollment.courseSnapshot.title[language]}</p>
                  <p>{t(enrollment.audience === 'foreign' ? 'foreignAudience' : 'egyptianAudience')} · {enrollment.priceSnapshot.amount === null ? t('contactUs') : formatMoneyMinor(enrollment.priceSnapshot.amount, enrollment.priceSnapshot.currency === 'USD' ? 'USD' : 'EGP')}</p>
                  <p>
                    {t(`enrollmentStatuses.${enrollment.enrollmentStatus}`)} ·{' '}
                    {t(`followUpStatuses.${enrollment.followUpStatus}`)}
                  </p>
                  {showPaymentColumns && <p>{t(`paymentStatuses.${status}`)}</p>}
                  {showPaymentColumns && <p>{t('netPaid')}: {formatMoneyMinor(minorNet(enrollment), enrollment.priceSnapshot.currency === 'USD' ? 'USD' : 'EGP')}</p>}
                  {user?.role === 'admin' && <p>{query.data.users.find((member) => member.id === enrollment.assignedToUserId)?.name[language] ?? t('unassigned')}</p>}
                </article>
              );
            })}
          </div>
          <footer className="flex items-center justify-between">
            <span>{t('results', { count: query.data.total })}</span>
            <select
              aria-label={t('pageSize')}
              className="min-h-11 rounded-xs border px-2"
              value={params.get('size') ?? '25'}
              onChange={(e) => setFilter('size', e.target.value)}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setFilter('page', String(page - 1))}
              >
                {t('previous')}
              </Button>
              <span className="self-center">
                {page}/{Math.max(query.data.pageCount, 1)}
              </span>
              <Button
                variant="secondary"
                disabled={page >= query.data.pageCount}
                onClick={() => setFilter('page', String(page + 1))}
              >
                {t('next')}
              </Button>
            </div>
          </footer>
        </>
      )}
    </main>
  );
}
function minorNet(enrollment: { id: string } & { paymentSummary?: { netMinor: number } }): number {
  if (enrollment.paymentSummary) return enrollment.paymentSummary.netMinor;
  return 0;
}
