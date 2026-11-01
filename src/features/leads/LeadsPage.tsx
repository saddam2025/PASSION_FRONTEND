import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/AuthContext';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { useLanguage } from '@/i18n/useLanguage';
import { computePaymentStatus } from '@/schemas/payment';
import { hasPermission } from '@/schemas/permissions';
import { leadsService } from '@/services/leads.mock';
import { readMockDb } from '@/mocks/db';
import { toCsv } from '@/lib/csv';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { formatDate } from '@/lib/formatters';

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
  const queryClient = useQueryClient();
  const toast = useToast();
  const queryString = params.toString();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const page = Number(params.get('page') ?? 1);
  const view = params.get('view') === 'customers' ? 'customers' : 'registrations';
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
        assigned: (params.get('assigned') ?? undefined) as 'me' | 'unassigned' | undefined,
        dateFrom: params.get('from') ? `${params.get('from')}T00:00:00.000Z` : undefined,
        dateTo: params.get('to') ? `${params.get('to')}T23:59:59.999Z` : undefined,
        needsAttention: params.get('attention') === '1',
        sort: (params.get('sort') ?? 'newest') as 'newest' | 'oldest' | 'name' | 'course',
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
    const end = today.toISOString().slice(0, 10);
    const start = new Date(today);
    if (preset === '7days') start.setDate(start.getDate() - 6);
    if (preset === '30days') start.setDate(start.getDate() - 29);
    if (preset === 'thisMonth') start.setDate(1);
    const next = new URLSearchParams(params);
    if (preset === 'custom') {
      next.delete('from');
      next.delete('to');
    } else {
      next.set('from', start.toISOString().slice(0, 10));
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
        assigned: (params.get('assigned') ?? undefined) as 'me' | 'unassigned' | undefined,
        dateFrom: params.get('from') ? `${params.get('from')}T00:00:00.000Z` : undefined,
        dateTo: params.get('to') ? `${params.get('to')}T23:59:59.999Z` : undefined,
        needsAttention: params.get('attention') === '1',
        sort: (params.get('sort') ?? 'newest') as 'newest' | 'oldest' | 'name' | 'course',
      });
      const headerKeys = [
        'reference',
        'name',
        'email',
        'phone',
        'course',
        'registeredAt',
        'enrollmentStatus',
        'paymentStatus',
        'followUp',
        'source',
        'campaign',
        'assignedTo',
      ];
      if (user && hasPermission(user, 'viewPayments'))
        headerKeys.push('price', 'currency', 'paid', 'outstanding');
      const headers = headerKeys.map((key) => t(`csv.${key}`));
      const rows = records.map(({ enrollment, lead, paymentStatus, paid, outstanding }) => [
        enrollment.reference,
        lead?.fullName,
        lead?.email,
        lead?.phone,
        enrollment.courseSnapshot.title[language],
        enrollment.registeredAt,
        enrollment.enrollmentStatus,
        paymentStatus,
        enrollment.followUpStatus,
        lead?.attribution.source,
        lead?.attribution.campaign,
        query.data?.users?.find((staff) => staff.id === enrollment.assignedToUserId)?.name[
          language
        ],
        ...(user && hasPermission(user, 'viewPayments')
          ? [enrollment.priceSnapshot.amount, enrollment.priceSnapshot.currency, paid, outstanding]
          : []),
      ]);
      const csv = toCsv(headers, rows);
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registrations.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.notify({
        title: records.length === 5000 ? t('exportCapped') : t('exportReady'),
        tone: 'success',
      });
    } catch {
      toast.notify({ title: t('loadError'), tone: 'danger' });
    }
  };
  const unique = query.data?.customerRows ?? [];
  return (
    <main className="grid gap-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted">
            {t('counts', {
              registrations: query.data?.total ?? 0,
              customers: query.data?.leads.length ?? 0,
            })}
          </p>
        </div>
        {canExport && view === 'registrations' && (
          <Button variant="secondary" onClick={exportRows}>
            {t('export')}
          </Button>
        )}
      </header>
      <nav className="flex gap-2" aria-label={t('views')}>
        <button
          className="min-h-11 rounded-pill border px-4"
          aria-pressed={view === 'registrations'}
          onClick={() => setFilter('view', 'registrations')}
        >
          {t('registrations')}
        </button>
        <button
          className="min-h-11 rounded-pill border px-4"
          aria-pressed={view === 'customers'}
          onClick={() => setFilter('view', 'customers')}
        >
          {t('customers')}
        </button>
      </nav>
      <div className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_14rem]">
        <input
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
        <select
          className="min-h-11 rounded-xs border px-3"
          value={params.get('course') ?? ''}
          onChange={(e) => setFilter('course', e.target.value)}
          aria-label={t('course')}
        >
          <option value="">{t('allCourses')}</option>
          {[...new Map((query.data?.enrollments ?? []).map((e) => [e.courseId, e])).values()].map(
            (e) => (
              <option key={e.courseId} value={e.courseId}>
                {e.courseSnapshot.title[language]}
              </option>
            ),
          )}
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
        <select
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
        </select>
        <label className="flex min-h-11 items-center gap-2 rounded-xs border px-3">
          <input
            type="checkbox"
            checked={params.get('attention') === '1'}
            onChange={(e) => setFilter('attention', e.target.checked ? '1' : '')}
          />
          {t('needsAttention')}
        </label>
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
      ) : view === 'customers' ? (
        <section className="grid gap-3">
          {unique.map(({ lead, count }) => (
            <Link
              className="rounded-sm border border-border bg-surface p-4"
              to={`${location.pathname}/${lead.id}`}
              key={lead.id}
            >
              <strong>{lead.fullName}</strong>
              <p dir="ltr" className="text-start text-sm text-muted">
                {lead.email} · {lead.phone}
              </p>
              <span>{t('enrollmentCount', { count })}</span>
            </Link>
          ))}
          {!unique.length && <EmptyState title={t('empty')} />}
        </section>
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
                    'registered',
                    'enrollment',
                    'payment',
                    'followUp',
                    'assignedTo',
                  ].map((key) => (
                    <th className="p-3" key={key}>
                      {t(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((enrollment) => {
                  const lead = query.data!.leads.find((x) => x.id === enrollment.leadId);
                  const status = computePaymentStatus(
                    enrollment.priceSnapshot,
                    readMockDb().payments.filter((p) => p.enrollmentId === enrollment.id),
                    enrollment.enrollmentStatus === 'cancelled',
                  );
                  return (
                    <tr key={enrollment.id} className="border-t border-border">
                      <td className="p-3">
                        <Link
                          className="font-semibold text-primary-strong underline"
                          to={`${location.pathname}/${enrollment.leadId}?enrollment=${enrollment.id}`}
                        >
                          {lead?.fullName}
                        </Link>
                        <p className="text-xs text-muted" dir="ltr">
                          {enrollment.reference}
                        </p>
                        {query.data!.enrollments.filter((item) => item.leadId === enrollment.leadId)
                          .length > 1 && (
                          <span className="rounded-pill bg-canvas px-2 py-1 text-xs">
                            {t('otherRegistrations', {
                              count:
                                query.data!.enrollments.filter(
                                  (item) => item.leadId === enrollment.leadId,
                                ).length - 1,
                            })}
                          </span>
                        )}
                      </td>
                      <td className="p-3" dir="ltr">
                        {lead?.email}
                      </td>
                      <td className="p-3" dir="ltr">
                        {lead?.phone}
                      </td>
                      <td className="p-3">{enrollment.courseSnapshot.title[language]}</td>
                      <td className="p-3" dir="ltr">
                        {formatDate(enrollment.registeredAt)}
                      </td>
                      <td className="p-3">
                        {t(`enrollmentStatuses.${enrollment.enrollmentStatus}`)}
                      </td>
                      <td className="p-3">
                        {query.data.users.find(
                          (member) => member.id === enrollment.assignedToUserId,
                        )?.name[language] ?? t('unassigned')}
                      </td>
                      <td className="p-3">{t(`paymentStatuses.${status}`)}</td>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {query.data.items.map((enrollment) => {
              const lead = query.data!.leads.find((x) => x.id === enrollment.leadId);
              const status = computePaymentStatus(
                enrollment.priceSnapshot,
                readMockDb().payments.filter((p) => p.enrollmentId === enrollment.id),
                enrollment.enrollmentStatus === 'cancelled',
              );
              return (
                <article
                  key={enrollment.id}
                  className="grid gap-2 rounded-sm border border-border bg-surface p-4"
                >
                  <Link
                    to={`${location.pathname}/${enrollment.leadId}?enrollment=${enrollment.id}`}
                    className="font-bold text-primary-strong underline"
                  >
                    {lead?.fullName}
                  </Link>
                  <p dir="ltr" className="text-start">
                    {lead?.email} · {lead?.phone}
                  </p>
                  <p>{enrollment.courseSnapshot.title[language]}</p>
                  <p>
                    {t(`enrollmentStatuses.${enrollment.enrollmentStatus}`)} ·{' '}
                    {t(`followUpStatuses.${enrollment.followUpStatus}`)}
                  </p>
                  <p>
                    {t(`paymentStatuses.${status}`)} ·{' '}
                    {query.data.users.find((member) => member.id === enrollment.assignedToUserId)
                      ?.name[language] ?? t('unassigned')}
                  </p>
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
