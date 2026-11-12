import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { useToast } from '@/components/ui/feedback';
import { useLanguage } from '@/i18n/useLanguage';
import { buildRegistrationMessage, buildRegistrationWhatsAppLink } from '@/lib/registrationWhatsApp';
import { isLikelyValidPhone } from '@/lib/phone';
import { formatRelativeTime } from '@/lib/formatters';
import { formatDate } from '@/lib/formatters';
import { hasPermission } from '@/schemas/permissions';
import type { Enrollment, Lead } from '@/schemas/lead';
import type { PaymentRecord } from '@/schemas/payment';
import { leadsService } from '@/services/leads.service';
import { settingsService } from '@/services/settings.api';
import { customerQueryKey, withFollowUpStatus } from './customerFollowUp';

interface Props {
  lead: Lead;
  enrollment: Enrollment;
  payments: PaymentRecord[];
  staffUsers: { id: string; name: { ar: string; en: string }; role: string; active: boolean }[];
}
type CustomerData = Awaited<ReturnType<typeof leadsService.getCustomer>>;

export default function CustomerActions({ lead, enrollment, payments, staffUsers }: Props) {
  const { t } = useTranslation('leads');
  const { language } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const client = useQueryClient();
  const [openedWhatsApp, setOpenedWhatsApp] = useState(false);
  const [dialog, setDialog] = useState<'cancel' | 'confirm' | null>(null);
  const [reason, setReason] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const templateQuery = useQuery({
    queryKey: ['registration-whatsapp-template', enrollment.courseId],
    queryFn: async () => {
      const settings = await settingsService.getPublicSettings();
      return { template: await leadsService.whatsappTemplate(enrollment.courseId, settings.registrationWhatsappTemplate), number: settings.whatsappNumber };
    },
  });
  const template = templateQuery.data?.template ?? '';
  const message = buildRegistrationMessage(
    template,
    lead.fullName,
    enrollment.courseSnapshot.title[language],
    enrollment.reference,
  );
  const whatsappNumber = templateQuery.data?.number || lead.phoneNormalized;
  const waLink = templateQuery.isSuccess ? buildRegistrationWhatsAppLink(whatsappNumber, message) : null;
  const waDisabledReason = !isLikelyValidPhone(whatsappNumber) ? t('phoneInvalid') : null;
  const records = payments.filter((item) => item.enrollmentId === enrollment.id);
  const paid = records
    .filter((item) => item.status === 'confirmed')
    .reduce((sum, item) => sum + (item.kind === 'payment' ? item.amount : -item.amount), 0);
  const staff = user?.role === 'admin' ? staffUsers.filter((item) => item.active) : [];
  const canManageFollow = Boolean(user && hasPermission(user, 'updateFollowUp'));
  const mutationDone = () => {
    setDialog(null);
    setReason('');
    void client.invalidateQueries({ queryKey: customerQueryKey(enrollment.id) });
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
    onMutate: async (input) => {
      const queryKey = customerQueryKey(enrollment.id);
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<CustomerData>(queryKey);
      client.setQueryData<CustomerData>(queryKey, (current) =>
        withFollowUpStatus(current, enrollment.id, input.status),
      );
      return { previous };
    },
    onError: (error: Error, _input, context) => {
      if (context) client.setQueryData(customerQueryKey(enrollment.id), context.previous);
      toast.notify({ title: error.message, tone: 'danger' });
    },
  });
  const contact = useMutation({
    mutationFn: () => leadsService.logContact(enrollment.id),
    onSuccess: mutationDone,
    onError: (error: Error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  const cancel = useMutation({
    mutationFn: () => leadsService.cancelEnrollment(enrollment.id, reason),
    onSuccess: mutationDone,
    onError: (error: Error) => toast.notify({ title: error.message, tone: 'danger' }),
  });
  const confirm = useMutation({
    mutationFn: () => leadsService.confirm(enrollment.id, reason),
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
  const canAssign = user?.role === 'admin';
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
            onClick={() => { setOpenedWhatsApp(true); contact.mutate(); }}
          >
            {t('openWhatsApp')}
          </a>
        ) : (
          <span className="text-sm text-muted">{waDisabledReason}</span>
        )}
        {openedWhatsApp && <span className="text-sm text-muted">{t('logContact')}</span>}
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
        {canAdmin && <Button
          variant="secondary"
          onClick={() => setDialog('confirm')}
          disabled={enrollment.enrollmentStatus !== 'pending'}
        >
          تأكيد التسجيل
        </Button>}
      {canAdmin && <Button
          variant="danger"
          onClick={() => setDialog('cancel')}
          disabled={enrollment.enrollmentStatus === 'cancelled'}
        >
          {t('cancelEnrollment')}
        </Button>}
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
                {(event as typeof event & { actorName?: string }).actorName || staffUsers.find((item) => item.id === event.actor)?.name.ar ||
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
        title={dialog === 'confirm' ? 'تأكيد التسجيل' : t('cancelEnrollment')}
        description={dialog === 'cancel' && paid > 0 ? t('refundReminder') : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              {t('dismissAction')}
            </Button>
            <Button
              variant={dialog === 'cancel' ? 'danger' : 'primary'}
              onClick={() => dialog === 'confirm' ? confirm.mutate() : cancel.mutate()}
              disabled={cancel.isPending || confirm.isPending || (dialog === 'cancel' && reason.trim().length < 3) || (dialog === 'confirm' && paid <= 0 && reason.trim().length < 3)}
            >
              {t('confirmAction')}
            </Button>
          </>
        }
      >
        <label className="grid gap-1">
          {dialog === 'confirm' ? 'سبب التأكيد' : t('reason')}
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
