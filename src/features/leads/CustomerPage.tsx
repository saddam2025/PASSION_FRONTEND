import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { EmptyState, ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { useLanguage } from '@/i18n/useLanguage';
import { computePaymentStatus } from '@/schemas/payment';
import { hasPermission } from '@/schemas/permissions';
import { leadsService } from '@/services/leads.service';
import { paymentsService } from '@/services/payments.service';
import { canVoidPaymentRecord } from '@/services/paymentAccess';
import { privateMediaService, receiptIdForKey } from '@/services/privateMedia';
import { apiErrorMessage } from '@/api/client';
import { formatPrice } from '@/features/public/courses/format';
import CustomerActions from './CustomerActions';
import { formatDate, formatPhone } from '@/lib/formatters';
import { majorToMinor, minorToMajor } from '@/lib/money';

export default function CustomerPage() {
  const { leadId = '' } = useParams();
  const [params] = useSearchParams();
  const { t } = useTranslation('leads');
  const { language } = useLanguage();
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [paymentKind, setPaymentKind] = useState<'payment' | 'refund'>('payment');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'e_wallet' | 'instapay' | 'other'>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptKey, setReceiptKey] = useState('');
  const [receivedAt, setReceivedAt] = useState(localDateTimeNow());
  const [unpaidId, setUnpaidId] = useState('');
  const [unpaidReason, setUnpaidReason] = useState('');
  const paymentKey = useRef('');
  const paymentFingerprint = useRef('');
  const recordLaunchHandled = useRef(false);
  const client = useQueryClient();
  const toast = useToast();
  const q = useQuery({
    queryKey: ['customer', leadId],
    queryFn: () => leadsService.getCustomer(leadId, user?.role),
  });
  const canView = Boolean(user && (user.role === 'admin' || user.role === 'assistant'));
  const canRecord = Boolean(user && hasPermission(user, 'recordPayments'));
  const add = useMutation({
    mutationFn: () => leadsService.addNote({ leadId, body: note }),
    onSuccess: () => {
      setNote('');
      void client.invalidateQueries({ queryKey: ['customer', leadId] });
    },
    onError: (error: Error) => toast.notify({ title: apiErrorMessage(error), tone: 'danger' }),
  });
  const payment = useMutation({
    mutationFn: (input: {
      enrollmentId: string;
      amount: number;
      currency: string;
      method: 'cash' | 'bank_transfer' | 'e_wallet' | 'instapay' | 'other';
      kind: 'payment' | 'refund';
      receivedAt: string;
      note?: string;
      reference?: string;
      receiptMediaKey?: string;
      idempotencyKey: string;
    }) => paymentsService.record(input),
    onSuccess: () => {
      setPaymentId('');
      setAmount('');
      setPaymentNote('');
      setPaymentReference(''); setReceiptKey(''); paymentFingerprint.current = '';
      void client.invalidateQueries({ queryKey: ['customer', leadId] });
    },
    onError: (error: Error) => toast.notify({ title: apiErrorMessage(error), tone: 'danger' }),
  });
  const markUnpaid = useMutation({
    mutationFn: () => paymentsService.markUnpaid(unpaidId, unpaidReason, user?.id, user?.role),
    onSuccess: () => {
      setUnpaidId('');
      setUnpaidReason('');
      void client.invalidateQueries({ queryKey: ['customer', leadId] });
    },
    onError: (error: Error) => toast.notify({ title: apiErrorMessage(error), tone: 'danger' }),
  });
  useEffect(() => {
    const enrollmentId=params.get('enrollment');
    const enrollment = q.data?.enrollments.find((item) => item.id === enrollmentId);
    if(!recordLaunchHandled.current&&canRecord&&params.get('record')==='1'&&enrollment){
      recordLaunchHandled.current=true;
      paymentKey.current=crypto.randomUUID();
      setPaymentId(enrollment.id);
      setAmount(enrollment.priceSnapshot.amount === null ? '' : String(minorToMajor(enrollment.priceSnapshot.amount)));
      setPaymentMethod('cash');
    }
  },[canRecord,params,q.data]);
  if (q.isLoading) return <Skeleton variant="card" />;
  if (q.isError) return <ErrorState title={apiErrorMessage(q.error)} onRetry={() => void q.refetch()} />;
  if (!q.data) return <EmptyState title={t('notFound')} />;
  const { lead, enrollments, notes } = q.data;
  const duplicateInfo = (q.data as typeof q.data & { possibleDuplicate?: { hasPossibleDuplicate?: boolean; references?: Array<{ reference: string }> }; otherEnrollments?: Array<{ reference: string }> }).possibleDuplicate;
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
        {(lead.possibleDuplicateOf || duplicateInfo?.hasPossibleDuplicate) && (
          <p className="rounded-xs bg-warning/10 p-3">
            {t('possibleDuplicate')}{duplicateInfo?.references?.length ? ` · ${duplicateInfo.references.map((item) => item.reference).join('، ')}` : ''}
          </p>
        )}
        {(q.data as typeof q.data & { otherEnrollments?: Array<{ reference: string }> }).otherEnrollments?.length ? <p className="text-sm">تسجيلات تانية لنفس الشخص: {(q.data as typeof q.data & { otherEnrollments?: Array<{ reference: string }> }).otherEnrollments!.map((item) => item.reference).join('، ')}</p> : null}
      </header>
      {!enrollments.length ? (
        <EmptyState title={t('noEnrollments')} />
      ) : (
        enrollments.map((enrollment) => {
          const records = q.data.payments.filter((p) => p.enrollmentId === enrollment.id);
          const summary = (enrollment as typeof enrollment & { paymentSummary?: { status: string; netMinor: number; outstandingMinor?: number | null } }).paymentSummary;
          const status = summary?.status ?? computePaymentStatus(
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
                        minorToMajor(enrollment.priceSnapshot.amount),
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
                  {canRecord && (
                    <div className="flex flex-wrap gap-2">
                    <Button disabled={status === 'paid'} onClick={() => {
                        paymentKey.current = crypto.randomUUID();
                        setPaymentId(enrollment.id);
                        setPaymentKind('payment');
                        setAmount(enrollment.priceSnapshot.amount === null ? '' : String(minorToMajor(enrollment.priceSnapshot.amount)));
                        setPaymentMethod('cash');
                        setPaymentNote(''); setPaymentReference(''); setReceiptKey(''); setReceivedAt(localDateTimeNow()); paymentFingerprint.current = '';
                      }}>تم الدفع
                    </Button>
                  <Button variant="outline" disabled={!records.some((record) => canVoidPaymentRecord(record, user))} onClick={() => setUnpaidId(enrollment.id)}>لم يتم الدفع</Button>
                  {user?.role === 'admin' && summary && summary.netMinor > 0 && <Button variant="outline" onClick={() => { paymentKey.current = crypto.randomUUID(); paymentFingerprint.current = ''; setPaymentKind('refund'); setPaymentId(enrollment.id); setAmount(String(minorToMajor(summary.netMinor))); setPaymentMethod('other'); setPaymentNote(''); setPaymentReference(''); setReceiptKey(''); setReceivedAt(localDateTimeNow()); }}>تسجيل استرداد</Button>}
                    </div>
                  )}
                  {canView && <p className="text-sm">صافي المدفوع: {formatPrice(minorToMajor(summary?.netMinor ?? records.filter((r) => r.status === 'confirmed').reduce((sum, r) => sum + (r.kind === 'payment' ? r.amount : -r.amount), 0)), enrollment.priceSnapshot.currency, language)} · المتبقي: {enrollment.priceSnapshot.amount === null ? '—' : formatPrice(minorToMajor(summary?.outstandingMinor ?? Math.max(enrollment.priceSnapshot.amount - records.filter((r) => r.status === 'confirmed').reduce((sum, r) => sum + (r.kind === 'payment' ? r.amount : -r.amount), 0), 0)), enrollment.priceSnapshot.currency, language)}</p>}
                  {records.length ? (
                    <ul className="mt-3 grid gap-2">
                      {[...records].sort((a, b) => a.receivedAt.localeCompare(b.receivedAt)).map((record) => (
                        <li key={record.id} className="rounded-xs border border-border p-3 text-sm">
                          <div className="flex flex-wrap justify-between gap-2">
                            <strong>{formatPrice(minorToMajor(record.amount), record.currency, language)}</strong>
                            <time dir="ltr">{formatDate(record.receivedAt)}</time>
                          </div>
                          <p>{t(`paymentMethods.${record.method}`)} · {t(`paymentRecordStatuses.${record.status}`)}</p>
                          {record.note && <p className="text-muted">{record.note}</p>}
                          {record.voidReason && <p className="text-muted">{record.voidReason}</p>}
                          {(record as typeof record & { receiptMediaKey?: string }).receiptMediaKey && receiptIdForKey((record as typeof record & { receiptMediaKey: string }).receiptMediaKey) && <Button variant="secondary" onClick={async () => { const id = receiptIdForKey((record as typeof record & { receiptMediaKey: string }).receiptMediaKey); if (!id) return; const popup = window.open('', '_blank', 'noopener,noreferrer'); try { const signed = await privateMediaService.getSignedUrl(id); if (popup) popup.location.href = signed.url; else window.open(signed.url, '_blank', 'noopener,noreferrer'); } catch (error) { popup?.close(); toast.notify({ title: apiErrorMessage(error), tone: 'danger' }); } }}>عرض الإيصال</Button>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted">{t('noPaymentRecords')}</p>
                  )}
                  <p className="text-sm text-muted">{t('manualPaymentOnly')}</p>
                </section>
              )}
              <CustomerActions lead={lead} enrollment={enrollment} payments={q.data.payments} staffUsers={q.data.users} />
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
              {formatDate(item.createdAt)}{(item as typeof item & { author?: { name?: { ar?: string } } }).author?.name?.ar ? ` · ${(item as typeof item & { author?: { name?: { ar?: string } } }).author?.name?.ar}` : ''}
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
        title={paymentKind === 'refund' ? 'تسجيل استرداد' : t('recordPayment')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentId('')}>
              {t('cancel')}
            </Button>
            <Button
                disabled={!isPositiveMinor(amount) || !receivedAt || payment.isPending || (paymentKind === 'refund' && paymentNote.trim().length < 3)}
              onClick={() => {
                const enrollment = enrollments.find((item) => item.id === paymentId);
                if (!enrollment) return;
                let minorAmount: number;
                try { minorAmount = majorToMinor(amount); } catch (error) { toast.notify({ title: error instanceof Error ? error.message : t('loadError'), tone: 'danger' }); return; }
                  const receivedDate = new Date(receivedAt);
                  if (!Number.isFinite(receivedDate.getTime())) { toast.notify({ title: 'تاريخ الاستلام غير صالح.', tone: 'danger' }); return; }
                  const payload = { enrollmentId: enrollment.id, amount: minorAmount, currency: enrollment.priceSnapshot.currency, method: paymentMethod, kind: paymentKind, receivedAt: receivedDate.toISOString(), note: paymentNote.trim() || undefined, reference: paymentReference.trim() || undefined, receiptMediaKey: receiptKey || undefined };
                const fingerprint = JSON.stringify(payload);
                if (paymentFingerprint.current && paymentFingerprint.current !== fingerprint) paymentKey.current = crypto.randomUUID();
                paymentFingerprint.current = fingerprint;
                payment.mutate({ ...payload, idempotencyKey: paymentKey.current });
              }}
            >
              {t('recordPayment')}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="grid gap-1">طريقة الدفع<select className="min-h-11 rounded-xs border px-3" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}><option value="cash">نقدًا</option><option value="bank_transfer">تحويل بنكي</option><option value="e_wallet">محفظة إلكترونية</option><option value="instapay">إنستاباي</option><option value="other">أخرى</option></select></label>
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
          <label className="grid gap-1">{paymentKind === 'refund' ? 'سبب الاسترداد' : 'ملاحظة اختيارية'}<textarea className="min-h-20 rounded-xs border p-3" required={paymentKind === 'refund'} value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} /></label>
          <label className="grid gap-1">تاريخ استلام المبلغ<input type="datetime-local" className="min-h-11 rounded-xs border px-3" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} /></label>
          <label className="grid gap-1">رقم مرجعي اختياري<input className="min-h-11 rounded-xs border px-3" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} /></label>
          {paymentKind === 'payment' && <label className="grid gap-1">إيصال اختياري<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const receipt = await privateMediaService.upload(file); setReceiptKey(receipt.receiptMediaKey ?? receipt.src); toast.notify({ title: 'تم رفع الإيصال.', tone: 'success' }); } catch (error) { toast.notify({ title: apiErrorMessage(error), tone: 'danger' }); } }} /></label>}
          {receiptKey && <p className="text-sm text-muted">تم إرفاق الإيصال.</p>}
        </div>
      </Modal>
      <Modal open={Boolean(unpaidId)} onOpenChange={(open) => !open && setUnpaidId('')} title="تأكيد عدم الدفع" footer={<><Button variant="secondary" onClick={() => setUnpaidId('')}>إلغاء</Button><Button variant="danger" disabled={unpaidReason.trim().length < 3 || markUnpaid.isPending} onClick={() => markUnpaid.mutate()}>لم يتم الدفع</Button></>}>
        <label className="grid gap-1">سبب التغيير<textarea className="min-h-24 rounded-xs border p-3" required value={unpaidReason} onChange={(event) => setUnpaidReason(event.target.value)} /></label>
      </Modal>
    </main>
  );
}
function Status({ text }: { text: string }) {
  return <span className="rounded-pill border border-border px-3 py-1 text-sm">● {text}</span>;
}
function localDateTimeNow() { const value = new Date(); value.setMinutes(value.getMinutes() - value.getTimezoneOffset()); return value.toISOString().slice(0, 16); }
function isPositiveMinor(value: string) { try { return majorToMinor(value) > 0; } catch { return false; } }
