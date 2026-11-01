import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { useToast } from '@/components/ui/feedback';
import { useLanguage } from '@/i18n/useLanguage';
import { computePaymentStatus, outstanding } from '@/schemas/payment';
import { hasPermission } from '@/schemas/permissions';
import { paymentsService } from '@/services/payments.mock';
import { readMockDb } from '@/mocks/db';
import { formatPrice } from '@/features/public/courses/format';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { formatDate } from '@/lib/formatters';

const paymentStatuses = ['pending', 'confirmed', 'voided'] as const;
const methods = ['cash', 'bank_transfer', 'e_wallet', 'instapay', 'other'] as const;
export default function PaymentsPage() {
  const { t } = useTranslation('payments');
  const { language } = useLanguage();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [action, setAction] = useState<{
    kind: 'refund' | 'void';
    enrollmentId: string;
    paymentId?: string;
  } | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const client = useQueryClient();
  const toast = useToast();
  const canView = Boolean(user && hasPermission(user, 'viewPayments'));
  const canRecord = Boolean(user && hasPermission(user, 'recordPayments'));
  const canFinancial = Boolean(user && hasPermission(user, 'viewFinancialReports'));
  const query = useQuery({
    queryKey: ['payments', params.toString()],
    enabled: canView,
    queryFn: () =>
      paymentsService.list({
        status: (params.get('status') ?? undefined) as (typeof paymentStatuses)[number] | undefined,
        method: (params.get('method') ?? undefined) as (typeof methods)[number] | undefined,
        kind: (params.get('kind') ?? undefined) as 'payment' | 'refund' | undefined,
        courseId: params.get('course') ?? undefined,
        recordedBy: params.get('recordedBy') ?? undefined,
        dateFrom: params.get('from') ? `${params.get('from')}T00:00:00.000Z` : undefined,
        dateTo: params.get('to') ? `${params.get('to')}T23:59:59.999Z` : undefined,
        page: Number(params.get('page') ?? 1),
        pageSize: Number(params.get('size') ?? 25),
      }),
  });
  const closeAction = () => {
    setAction(null);
    setAmount('');
    setReason('');
  };
  const voidMutation = useMutation({
    mutationFn: () =>
      action?.paymentId
        ? paymentsService.void(action.paymentId, reason)
        : Promise.reject(new Error('المدفوعة مش موجودة.')),
    onSuccess: () => {
      closeAction();
      void client.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: Error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  const refundMutation = useMutation({
    mutationFn: () =>
      action
        ? paymentsService.refund(
            action.enrollmentId,
            Math.round(Number(amount) * 100),
            'cash',
            reason,
          )
        : Promise.reject(new Error('التسجيل مش موجود.')),
    onSuccess: () => {
      closeAction();
      void client.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: Error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };
  const db = readMockDb();
  const awaiting = db.enrollments
    .filter(
      (e) =>
        ['pending', 'confirmed'].includes(e.enrollmentStatus) &&
        ['unpaid', 'pending', 'partially_paid'].includes(
          computePaymentStatus(
            e.priceSnapshot,
            db.payments.filter((p) => p.enrollmentId === e.id),
            e.enrollmentStatus === 'cancelled',
          ),
        ),
    )
    .sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
  if (!canView) return <EmptyState title={t('accessDenied')} />;
  if (query.isLoading)
    return (
      <div className="grid gap-3">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  if (query.isError)
    return <ErrorState title={t('loadError')} onRetry={() => void query.refetch()} />;
  const page = Number(params.get('page') ?? 1);
  const tab = params.get('tab') === 'awaiting' ? 'awaiting' : 'records';
  return (
    <main className="grid gap-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </header>
      <nav className="flex gap-2">
        <button
          className="min-h-11 rounded-pill border px-4"
          aria-pressed={tab === 'awaiting'}
          onClick={() => setFilter('tab', 'awaiting')}
        >
          {t('awaiting')}
        </button>
        <button
          className="min-h-11 rounded-pill border px-4"
          aria-pressed={tab === 'records'}
          onClick={() => setFilter('tab', 'records')}
        >
          {t('records')}
        </button>
      </nav>
      {tab === 'awaiting' ? (
        <section className="grid gap-3">
          <p>{t('awaitingCount', { count: awaiting.length })}</p>
          {awaiting.length ? (
            awaiting.map((e) => {
              const records = db.payments.filter((p) => p.enrollmentId === e.id);
              const due = outstanding(e.priceSnapshot, records);
              const lead = db.leads.find((l) => l.id === e.leadId);
              const status = computePaymentStatus(
                e.priceSnapshot,
                records,
                e.enrollmentStatus === 'cancelled',
              );
              const route = user?.role === 'admin' ? 'admin' : 'assistant';
              return (
                <article
                  key={e.id}
                  className="grid gap-2 rounded-sm border border-border bg-surface p-4"
                >
                  <strong>{e.courseSnapshot.title[language]}</strong>
                  <p>
                    {t('customer')}: {lead?.fullName}
                  </p>
                  <p>
                    {t('reference')}: <span dir="ltr">{e.reference}</span>
                  </p>
                  <p>
                    {t('statusPayment')}: {t(`status.${status}`)}
                  </p>
                  {canView && due !== null && (
                    <p>
                      {t('outstanding')}:{' '}
                      {formatPrice(due / 100, e.priceSnapshot.currency, language)}
                    </p>
                  )}
                  {canRecord && (
                    <Link
                      className="inline-flex min-h-11 items-center justify-center rounded-xs border px-4"
                      to={`/${route}/leads/${e.leadId}?enrollment=${e.id}&record=1`}
                    >
                      {t('recordPayment')}
                    </Link>
                  )}
                </article>
              );
            })
          ) : (
            <EmptyState title={t('emptyAwaiting')} />
          )}
        </section>
      ) : (
        <section className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <select
              className="min-h-11 rounded-xs border px-3"
              value={params.get('status') ?? ''}
              onChange={(e) => setFilter('status', e.target.value)}
              aria-label={t('statusPayment')}
            >
              <option value="">{t('allStatuses')}</option>
              {paymentStatuses.map((s) => (
                <option key={s} value={s}>
                  {t(`recordStatus.${s}`)}
                </option>
              ))}
            </select>
            <select
              className="min-h-11 rounded-xs border px-3"
              aria-label={t('course')}
              value={params.get('course') ?? ''}
              onChange={(e) => setFilter('course', e.target.value)}
            >
              <option value="">{t('allCourses')}</option>
              {db.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.details?.title?.[language] || course.slug}
                </option>
              ))}
            </select>
            <select
              className="min-h-11 rounded-xs border px-3"
              aria-label={t('recordedBy')}
              value={params.get('recordedBy') ?? ''}
              onChange={(e) => setFilter('recordedBy', e.target.value)}
            >
              <option value="">{t('allStaff')}</option>
              {db.users
                .filter((member) => member.active)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name[language]}
                  </option>
                ))}
            </select>
            <select
              className="min-h-11 rounded-xs border px-3"
              value={params.get('method') ?? ''}
              onChange={(e) => setFilter('method', e.target.value)}
              aria-label={t('method')}
            >
              <option value="">{t('allMethods')}</option>
              {methods.map((m) => (
                <option key={m} value={m}>
                  {t(`methods.${m}`)}
                </option>
              ))}
            </select>
            <select
              className="min-h-11 rounded-xs border px-3"
              value={params.get('kind') ?? ''}
              onChange={(e) => setFilter('kind', e.target.value)}
              aria-label={t('kind')}
            >
              <option value="">{t('allKinds')}</option>
              <option value="payment">{t('payment')}</option>
              <option value="refund">{t('refund')}</option>
            </select>
            <DateRangePicker
              from={params.get('from') ?? ''}
              to={params.get('to') ?? ''}
              label={`${t('from')} – ${t('to')}`}
              onChange={(from, to) => {
                const next = new URLSearchParams(params);
                next.set('from', from);
                next.set('to', to);
                setParams(next);
              }}
            />
          </div>
          {canFinancial && (
            <div className="flex flex-wrap gap-3 rounded-sm border border-border bg-surface p-4">
              <strong>{t('confirmedNet')}</strong>
              {Object.entries(query.data?.totals ?? {}).map(([currency, amount]) => (
                <span key={currency}>{formatPrice(amount / 100, currency, language)}</span>
              ))}
            </div>
          )}
          {!query.data?.items.length ? (
            <EmptyState title={t('emptyRecords')} />
          ) : (
            <div className="grid gap-3">
              {query.data.items.map((record) => {
                const lead = record.lead;
                const enrollment = record.enrollment;
                return (
                  <article
                    key={record.id}
                    className="grid gap-2 rounded-sm border border-border bg-surface p-4"
                  >
                    <p>
                      {lead?.fullName ?? t('unknownCustomer')} ·{' '}
                      {enrollment?.courseSnapshot.title[language]}
                    </p>
                    <p>
                      {t(`recordKind.${record.kind}`)} · {t(`recordStatus.${record.status}`)} ·{' '}
                      {t(`methods.${record.method}`)}
                    </p>
                    {canView && (
                      <p>{formatPrice(record.amount / 100, record.currency, language)}</p>
                    )}
                    <p dir="ltr">{record.reference}</p>
                    <time dir="ltr">
                      {formatDate(record.receivedAt)}
                    </time>
                    {user?.role === 'admin' && record.status !== 'voided' && (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setAction({ kind: 'refund', enrollmentId: record.enrollmentId });
                            setReason('');
                          }}
                        >
                          {t('refund')}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            setAction({
                              kind: 'void',
                              enrollmentId: record.enrollmentId,
                              paymentId: record.id,
                            });
                            setReason('');
                          }}
                        >
                          {t('void')}
                        </Button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
          <footer className="flex items-center justify-between">
            <span>{t('results', { count: query.data?.total ?? 0 })}</span>
            <select
              className="min-h-11 rounded-xs border px-2"
              value={params.get('size') ?? '25'}
              onChange={(e) => setFilter('size', e.target.value)}
              aria-label={t('pageSize')}
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
                {page}/{Math.max(query.data?.pageCount ?? 1, 1)}
              </span>
              <Button
                variant="secondary"
                disabled={page >= (query.data?.pageCount ?? 1)}
                onClick={() => setFilter('page', String(page + 1))}
              >
                {t('next')}
              </Button>
            </div>
          </footer>
          <Modal
            open={Boolean(action)}
            onOpenChange={(open) => !open && closeAction()}
            title={action?.kind === 'refund' ? t('refund') : t('void')}
            description={action?.kind === 'void' ? t('voidImmutableNote') : undefined}
            footer={
              <>
                <Button variant="secondary" onClick={closeAction}>
                  {t('cancel')}
                </Button>
                <Button
                  variant="danger"
                  disabled={
                    reason.trim().length < 3 ||
                    (action?.kind === 'refund' && (!amount || Number(amount) <= 0)) ||
                    voidMutation.isPending ||
                    refundMutation.isPending
                  }
                  onClick={() =>
                    action?.kind === 'void' ? voidMutation.mutate() : refundMutation.mutate()
                  }
                >
                  {t('confirm')}
                </Button>
              </>
            }
          >
            <div className="grid gap-3">
              {action?.kind === 'refund' && (
                <label className="grid gap-1">
                  {t('amount')}
                  <input
                    className="min-h-11 rounded-xs border px-3"
                    dir="ltr"
                    inputMode="decimal"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>
              )}
              <label className="grid gap-1">
                {t('reason')}
                <textarea
                  className="min-h-24 rounded-xs border p-3"
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
            </div>
          </Modal>
        </section>
      )}
    </main>
  );
}
