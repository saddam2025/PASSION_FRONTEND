import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { useLanguage } from '@/i18n/useLanguage';
import { computePaymentStatus, outstanding } from '@/schemas/payment';
import { hasPermission } from '@/schemas/permissions';
import { leadsService } from '@/services/leads.mock';
import { paymentsService } from '@/services/payments.mock';
import { readMockDb } from '@/mocks/db';
import { formatPrice } from '@/features/public/courses/format';
import CustomerActions from './CustomerActions';
import { formatDate, formatPhone } from '@/lib/formatters';

export default function CustomerPage() {
  const { leadId = '' } = useParams();
  const [params] = useSearchParams();
  const { t } = useTranslation('leads');
  const { language } = useLanguage();
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [acknowledge, setAcknowledge] = useState(false);
  const paymentKey = useRef('');
  const recordLaunchHandled = useRef(false);
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ['customer', leadId],
    queryFn: () => leadsService.getCustomer(leadId),
  });
  const canView = Boolean(user && hasPermission(user, 'viewPayments'));
  const canRecord = Boolean(user && hasPermission(user, 'recordPayments'));
  const add = useMutation({
    mutationFn: () => leadsService.addNote({ leadId, body: note }),
    onSuccess: () => {
      setNote('');
      void client.invalidateQueries({ queryKey: ['customer', leadId] });
    },
  });
  const payment = useMutation({
    mutationFn: (input: {
      enrollmentId: string;
      amount: number;
      currency: string;
      acknowledgeOverpayment: boolean;
      idempotencyKey: string;
    }) =>
      paymentsService.record({
        ...input,
        kind: 'payment',
        method: 'cash',
        receivedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      setPaymentId('');
      setAmount('');
      setAcknowledge(false);
      void client.invalidateQueries({ queryKey: ['customer', leadId] });
    },
  });
  useEffect(() => {
    const enrollmentId=params.get('enrollment');
    if(!recordLaunchHandled.current&&canRecord&&params.get('record')==='1'&&enrollmentId&&q.data?.enrollments.some((item)=>item.id===enrollmentId)){
      recordLaunchHandled.current=true;
      paymentKey.current=crypto.randomUUID();
      setPaymentId(enrollmentId);
    }
  },[canRecord,params,q.data]);
  if (q.isLoading) return <Skeleton variant="card" />;
  if (q.isError) return <ErrorState title={t('loadError')} onRetry={() => void q.refetch()} />;
  if (!q.data) return <EmptyState title={t('notFound')} />;
  const { lead, enrollments, notes } = q.data;
  return (
    <main className="grid gap-5" dir="rtl">
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold">{lead.fullName}</h1>
        <p dir="ltr" className="text-start text-muted">
          <a href={`mailto:${lead.email}`}>{lead.email}</a> ·{' '}
          <a href={`tel:+${lead.phoneNormalized}`} className="latin-text">+{formatPhone(lead.phoneNormalized)}</a>
        </p>
        <p className="text-sm text-muted">
          {t('createdAt')}:{' '}
          <time dir="ltr">
            {formatDate(lead.createdAt)}
          </time>
        </p>
        {lead.possibleDuplicateOf && (
          <p className="rounded-xs bg-warning/10 p-3">
            {t('possibleDuplicate')} ·{' '}
            <a className="underline" href={`./${lead.possibleDuplicateOf}`}>
              {t('viewDuplicate')}
            </a>
          </p>
        )}
        <p>
          {lead.attribution.source} {lead.attribution.campaign}
        </p>
      </header>
      {!enrollments.length ? (
        <EmptyState title={t('noEnrollments')} />
      ) : (
        enrollments.map((enrollment) => {
          const records = readMockDb().payments.filter((p) => p.enrollmentId === enrollment.id);
          const status = computePaymentStatus(
            enrollment.priceSnapshot,
            records,
            enrollment.enrollmentStatus === 'cancelled',
          );
          const selected = params.get('enrollment') === enrollment.id;
          return (
            <article
              key={enrollment.id}
              className={`grid gap-4 rounded-sm border border-border bg-surface p-5 ${selected ? 'ring-2 ring-primary' : ''}`}
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{enrollment.courseSnapshot.title.ar}</h2>
                  <p dir="ltr">
                    {t('reference')}: {enrollment.reference}
                  </p>
                  <time dir="ltr" className="text-sm text-muted">
                    {formatDate(enrollment.registeredAt)}
                  </time>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Status text={t(`enrollmentStatuses.${enrollment.enrollmentStatus}`)} />
                  <Status text={t(`followUpStatuses.${enrollment.followUpStatus}`)} />
                  {canView && <Status text={t(`paymentStatuses.${status}`)} />}
                </div>
              </header>
              {canView && (
                <p>
                  {t('price')}:{' '}
                  {enrollment.priceSnapshot.amount === null
                    ? t('contactUs')
                    : formatPrice(
                        enrollment.priceSnapshot.amount / 100,
                        enrollment.priceSnapshot.currency,
                        language,
                      )}
                </p>
              )}
              <section>
                <h3 className="font-semibold">{t('answers')}</h3>
                <dl className="grid gap-2">
                  {enrollment.formSnapshot.fields.map((field) => (
                    <div key={field.id}>
                      <dt className="text-sm text-muted">{field.label[language]}</dt>
                      <dd className="whitespace-pre-wrap">
                        {String(enrollment.answers[field.id] ?? '—')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
              {canView && (
                <section>
                  <h3 className="font-semibold">{t('payments')}</h3>
                  <p>
                    {records.length} {t('records')} · {t(`paymentStatuses.${status}`)}
                  </p>
                  {records.map((record) => (
                    <p key={record.id} dir="ltr">
                      {record.kind} · {record.amount} {record.currency} · {record.status}
                    </p>
                  ))}
                  {canRecord && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        paymentKey.current = crypto.randomUUID();
                        setPaymentId(enrollment.id);
                        setAmount('');
                        setAcknowledge(false);
                      }}
                    >
                      {t('recordPayment')}
                    </Button>
                  )}
                  <p className="text-sm text-muted">{t('manualPaymentOnly')}</p>
                </section>
              )}
              <CustomerActions lead={lead} enrollment={enrollment} />
            </article>
          );
        })
      )}
      <section className="grid gap-3 rounded-sm border border-border bg-surface p-5">
        <h2 className="text-xl font-bold">{t('notes')}</h2>
        {notes.map((item) => (
          <p key={item.id} className="whitespace-pre-wrap">
            {item.body}
            <small className="ms-2 text-muted">
              {formatDate(item.createdAt)}
            </small>
          </p>
        ))}
        {user && hasPermission(user, 'manageNotes') && (
          <>
            <textarea
              className="min-h-24 rounded-xs border border-border p-3"
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-label={t('notes')}
            />
            <Button onClick={() => add.mutate()} disabled={!note.trim()}>
              {t('addNote')}
            </Button>
          </>
        )}
      </section>
      <Modal
        open={Boolean(paymentId)}
        onOpenChange={(open) => !open && setPaymentId('')}
        title={t('recordPayment')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentId('')}>
              {t('cancel')}
            </Button>
            <Button
              disabled={!amount || Number(amount) <= 0 || payment.isPending}
              onClick={() => {
                const enrollment = enrollments.find((item) => item.id === paymentId);
                if (!enrollment) return;
                payment.mutate({
                  enrollmentId: enrollment.id,
                  amount: Math.round(Number(amount) * 100),
                  currency: enrollment.priceSnapshot.currency,
                  acknowledgeOverpayment: acknowledge,
                  idempotencyKey: paymentKey.current,
                });
              }}
            >
              {t('recordPayment')}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="grid gap-1">
            {t('amount')} (
            {enrollments.find((item) => item.id === paymentId)?.priceSnapshot.currency})
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
          {(() => {
            const enrollment = enrollments.find((item) => item.id === paymentId);
            const due = enrollment
              ? outstanding(
                  enrollment.priceSnapshot,
                  readMockDb().payments.filter((item) => item.enrollmentId === enrollment.id),
                )
              : null;
            const over = due !== null && Number(amount) * 100 > due;
            return over ? (
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={acknowledge}
                  onChange={(e) => setAcknowledge(e.target.checked)}
                />
                {t('acknowledgeOverpayment')}
              </label>
            ) : null;
          })()}
        </div>
      </Modal>
    </main>
  );
}
function Status({ text }: { text: string }) {
  return <span className="rounded-pill border border-border px-3 py-1 text-sm">● {text}</span>;
}
