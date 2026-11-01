import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { useToast } from '@/components/ui/feedback';
import { useLanguage } from '@/i18n/useLanguage';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { isLikelyValidPhone } from '@/lib/phone';
import { formatRelativeTime } from '@/lib/formatters';
import { formatDate } from '@/lib/formatters';
import { computePaymentStatus } from '@/schemas/payment';
import { hasPermission } from '@/schemas/permissions';
import type { Enrollment, Lead } from '@/schemas/lead';
import { readMockDb } from '@/mocks/db';
import { leadsService } from '@/services/leads.mock';

interface Props {
  lead: Lead;
  enrollment: Enrollment;
}
interface MessagingSettings {
  postRegistration?: { ar?: string; en?: string };
  genericGreeting?: { ar?: string; en?: string };
}
export default function CustomerActions({ lead, enrollment }: Props) {
  const { t } = useTranslation('leads');
  const { language } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const client = useQueryClient();
  const [openedWhatsApp, setOpenedWhatsApp] = useState(false);
  const [dialog, setDialog] = useState<'confirm' | 'cancel' | null>(null);
  const [reason, setReason] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const db = readMockDb();
  const allSettings = db.settings.values;
  const messaging = allSettings.messaging as MessagingSettings | undefined;
  const courseTemplate = db.courses.find((item) => item.id === enrollment.courseId)?.details?.contact
    ?.whatsappMessageTemplate;
  const template =
    messaging?.postRegistration?.[language] ||
    courseTemplate?.[language] ||
    messaging?.genericGreeting?.[language] ||
    '';
  const message = template
    .replaceAll('{name}', lead.fullName)
    .replaceAll('{course}', enrollment.courseSnapshot.title[language])
    .replaceAll('{reference}', enrollment.reference);
  const waLink = template ? buildWhatsAppLink({ phone: lead.phoneNormalized, message }) : null;
  const waDisabledReason = !isLikelyValidPhone(lead.phoneNormalized)
    ? t('phoneInvalid')
    : !template
      ? t('messageUnavailable')
      : null;
  const records = db.payments.filter((item) => item.enrollmentId === enrollment.id);
  const paid = records
    .filter((item) => item.status === 'confirmed')
    .reduce((sum, item) => sum + (item.kind === 'payment' ? item.amount : -item.amount), 0);
  const paymentStatus = computePaymentStatus(
    enrollment.priceSnapshot,
    records,
    enrollment.enrollmentStatus === 'cancelled',
  );
  const noPrice = enrollment.priceSnapshot.amount === null || enrollment.priceSnapshot.amount === 0;
  const needsOverride = paymentStatus !== 'paid' && !noPrice;
  const staff = db.users.filter((item) => item.active);
  const canManageFollow = Boolean(user && hasPermission(user, 'updateFollowUp'));
  const mutationDone = () => {
    setDialog(null);
    setReason('');
    void client.invalidateQueries({ queryKey: ['customer', lead.id] });
    void client.invalidateQueries({ queryKey: ['leads'] });
  };
  const assign = useMutation({
    mutationFn: (id?: string) => leadsService.assign(enrollment.id, id),
    onSuccess: mutationDone,
    onError: (error: Error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  const updateFollow = useMutation({
    mutationFn: (input: { status: Enrollment['followUpStatus']; note: string }) =>
      leadsService.updateFollowUp(enrollment.id, input.status, input.note),
    onSuccess: mutationDone,
  });
  const contact = useMutation({
    mutationFn: () => leadsService.logContact(enrollment.id, canManageFollow),
    onSuccess: mutationDone,
  });
  const confirm = useMutation({
    mutationFn: () => leadsService.confirmEnrollment(enrollment.id, reason),
    onSuccess: mutationDone,
    onError: (error: Error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  const cancel = useMutation({
    mutationFn: () => leadsService.cancelEnrollment(enrollment.id, reason),
    onSuccess: mutationDone,
    onError: (error: Error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  const timeline = useMemo(
    () =>
      [
        ...enrollment.history.map((event) => ({
          id: `${event.type}-${event.at}`,
          label:
            event.type === 'follow_up'
              ? t('timeline.follow_up', {
                  from: t(`followUpStatuses.${event.from}`),
                  to: t(`followUpStatuses.${event.to}`),
                })
              : t(`timeline.${event.type}`, { from: event.from, to: event.to }),
          actor: event.actor,
          at: event.at,
        })),
        ...records.map((record) => ({
          id: record.id,
          label: t(`timeline.payment_${record.kind}`, { status: record.status }),
          actor: record.recordedBy,
          at: record.createdAt,
        })),
      ].sort((a, b) => a.at.localeCompare(b.at)),
    [enrollment.history, records, t],
  );
  const relative = (at: string) => {
    const ms = Date.now() - Date.parse(at);
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
      ['year', 31536000000],
      ['month', 2592000000],
      ['week', 604800000],
      ['day', 86400000],
      ['hour', 3600000],
      ['minute', 60000],
    ];
    const [unit, size] = units.find(([, limit]) => ms >= limit) ?? ['second', 1000];
    return formatRelativeTime(-Math.floor(ms / size), unit);
  };
  const canAdmin = user?.role === 'admin';
  const canAssign = Boolean(
    user &&
      (user.role === 'admin' ||
        !enrollment.assignedToUserId ||
        enrollment.assignedToUserId === user.id),
  );
  return (
    <section className="grid gap-4 rounded-sm border border-border bg-canvas p-4">
      <header className="flex flex-wrap items-center gap-2">
        <strong>{t('actions')}</strong>
        {waLink ? (
          <a
            className="inline-flex min-h-11 items-center rounded-xs border bg-surface px-4"
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpenedWhatsApp(true)}
          >
            {t('openWhatsApp')}
          </a>
        ) : (
          <span className="text-sm text-muted">{waDisabledReason}</span>
        )}
        {openedWhatsApp && (
          <Button variant="secondary" onClick={() => contact.mutate()} disabled={contact.isPending}>
            {t('logContact')}
          </Button>
        )}
      </header>
      {canManageFollow && (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1">
            {t('followUp')}
            <select
              className="min-h-11 rounded-xs border px-3"
              value={enrollment.followUpStatus}
              onChange={(e) =>
                updateFollow.mutate({
                  status: e.target.value as Enrollment['followUpStatus'],
                  note: followUpNote,
                })
              }
            >
              {[
                'new',
                'contacted',
                'interested',
                'awaiting_payment',
                'no_answer',
                'not_interested',
                'closed',
              ].map((status) => (
                <option key={status} value={status}>
                  {t(`followUpStatuses.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            {t('followUpNote')}
            <input
              className="min-h-11 rounded-xs border px-3"
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              placeholder={t('optionalNote')}
            />
          </label>
        </div>
      )}
      {canAssign && (
        <label className="grid gap-1 sm:max-w-sm">
          {t('assigned')}
          <select
            className="min-h-11 rounded-xs border px-3"
            value={enrollment.assignedToUserId ?? ''}
            onChange={(e) => assign.mutate(e.target.value || undefined)}
          >
            <option value="">{t('unassigned')}</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name[language]}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {(noPrice || paymentStatus === 'paid' || canAdmin) &&
          enrollment.enrollmentStatus !== 'confirmed' && (
            <Button variant="secondary" onClick={() => setDialog('confirm')}>
              {t('confirmEnrollment')}
            </Button>
          )}
        <Button
          variant="danger"
          onClick={() => setDialog('cancel')}
          disabled={enrollment.enrollmentStatus === 'cancelled'}
        >
          {t('cancelEnrollment')}
        </Button>
        {needsOverride && canAdmin && (
          <span className="self-center text-sm text-warning">{t('adminOverrideReason')}</span>
        )}
      </div>
      {paid > 0 && <p className="text-sm text-warning">{t('refundReminder')}</p>}
      <details>
        <summary className="min-h-11 cursor-pointer font-semibold">{t('timeline.title')}</summary>
        <ol className="grid gap-3 border-s border-border ps-4">
          {timeline.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -start-[1.4rem] top-1 size-2 rounded-full bg-primary" />
              <p>{event.label}</p>
              <p className="text-xs text-muted">
                {db.users.find((item) => item.id === event.actor)?.name[language] ??
                  (event.actor === 'visitor' ? t('visitor') : t('system'))}{' '}
                ·{' '}
                <time dateTime={event.at} title={formatDate(event.at, { dateStyle: 'medium', timeStyle: 'short' })}>
                  {relative(event.at)}
                </time>
              </p>
            </li>
          ))}
        </ol>
      </details>
      <Modal
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog === 'confirm' ? t('confirmEnrollment') : t('cancelEnrollment')}
        description={dialog === 'cancel' && paid > 0 ? t('refundReminder') : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              {t('dismissAction')}
            </Button>
            <Button
              variant={dialog === 'cancel' ? 'danger' : 'primary'}
              onClick={() => (dialog === 'confirm' ? confirm.mutate() : cancel.mutate())}
              disabled={
                Boolean(dialog === 'cancel' ? cancel.isPending : confirm.isPending) ||
                ((dialog === 'cancel' || needsOverride) && reason.trim().length < 3)
              }
            >
              {t('confirmAction')}
            </Button>
          </>
        }
      >
        <label className="grid gap-1">
          {t(dialog === 'cancel' || needsOverride ? 'reason' : 'optionalReason')}
          <textarea
            className="min-h-24 rounded-xs border p-3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
          />
        </label>
      </Modal>
    </section>
  );
}
