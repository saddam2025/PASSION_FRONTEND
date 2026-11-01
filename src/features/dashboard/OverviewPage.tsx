import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/AuthContext';
import { Skeleton, ErrorState, EmptyState } from '@/components/ui/feedback';
import { overviewService } from '@/services/overview';
import { hasPermission } from '@/schemas/permissions';
import { academyDateKey } from '@/lib/timezone';
import { Button } from '@/components/ui/Button';
import { useNewCourseDialog } from '@/features/courses/newCourseDialogStore';
import { formatDate, formatMoney } from '@/lib/formatters';

const panel = 'grid content-start gap-3 rounded-sm border border-border bg-surface p-4';
export default function OverviewPage() {
  const { t } = useTranslation(['dashboard', 'audit']);
  const { user } = useAuth();
  const newCourse = useNewCourseDialog();
  const result = useQuery({ queryKey: ['admin-overview'], queryFn: () => overviewService.get() });
  const name = user?.name.ar || user?.email || '';
  const now = new Date();
  const date = formatDate(now, {
    dateStyle: 'full',
    timeZone: 'Africa/Cairo',
  });
  const today = academyDateKey(now);
  const greeting = t('workQueue.greeting', { name });
  if (result.isPending)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  if (result.isError || !result.data)
    return (
      <ErrorState
        title={t('workQueue.loadError', {
          defaultValue: 'حصلت مشكلة في تحميل الملخص، جرّب تاني.',
        })}
        onRetry={() => void result.refetch()}
      />
    );
  const data = result.data;
  const cards = [
    ['pendingReviews', data.counts.pendingReviews, '/admin/review?status=pending_review'],
    ['newLeads', data.counts.newLeads, '/admin/leads?followUp=new&attention=1'],
    [
      'awaitingPayment',
      data.counts.awaitingPayment,
      '/admin/leads?payment=unpaid,pending,partially_paid',
    ],
    ['drafts', data.counts.drafts, '/admin/courses?status=draft'],
    ['rejected', data.counts.rejected, '/admin/review?status=rejected'],
  ] as const;
  const canFinance = Boolean(user && hasPermission(user, 'viewFinancialReports'));
  const canPay = Boolean(user && hasPermission(user, 'viewPayments'));
  const maxCount = Math.max(1, ...data.registrations14d.map((point) => point.count));
  return (
    <main className="grid gap-5">
      <header>
        <p className="text-sm text-muted">{date}</p>
        <h1 className="mt-1 text-3xl font-bold">{greeting}</h1>
        <h2 className="mt-3 text-lg font-semibold">{t('workQueue.attention')}</h2>
      </header>
      <section
        aria-label={t('workQueue.attention')}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        {cards.map(([key, count, to]) => (
          <Link
            key={key}
            to={to}
            className="grid min-h-28 content-between rounded-sm border border-border bg-surface p-4 hover:border-primary"
          >
            <span className="text-sm text-muted">{t(`workQueue.${key}`)}</span>
            <strong className="text-3xl tabular-nums">{count}</strong>
          </Link>
        ))}
      </section>
      <div className="flex flex-wrap gap-2">
        <Button onClick={newCourse.open}>{t('newCourse')}</Button>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xs border border-border px-5 text-sm font-semibold"
          to="/admin/users?invite=1"
        >
          {t('workQueue.inviteAssistant')}
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xs border border-border px-5 text-sm font-semibold"
          to="/admin/leads"
        >
          {t('nav.leads')}
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xs border border-border px-5 text-sm font-semibold"
          to="/admin/settings"
        >
          {t('nav.settings')}
        </Link>
      </div>
      <section className="grid gap-4 xl:grid-cols-2">
        <article className={panel}>
          <h2 className="font-bold">{t('workQueue.pendingReviews')}</h2>
          {data.pending.length ? (
            data.pending.map((item) => (
              <Link
                key={item.id}
                to={`/admin/review/${item.id}`}
                className="flex flex-wrap justify-between gap-2 border-t border-border pt-3 text-sm"
              >
                <span className="font-semibold">
                  {item.course.ar}
                </span>
                <span className="text-muted">
                  {item.author.ar} ·{' '}
                  {formatDate(item.at, {
                    dateStyle: 'medium',
                    timeZone: 'Africa/Cairo',
                  })}
                </span>
              </Link>
            ))
          ) : (
            <EmptyState title={t('workQueue.emptyReviews')} />
          )}
        </article>
        <article className={panel}>
          <h2 className="font-bold">{t('workQueue.awaitingPayments')}</h2>
          {data.awaiting.length ? (
            data.awaiting.map((item) => (
              <Link
                key={item.id}
                to={item.leadId ? `/admin/leads/${item.leadId}` : '/admin/payments'}
                className="flex flex-wrap justify-between gap-2 border-t border-border pt-3 text-sm"
              >
                <span>
                  {item.name || t('workQueue.registration')} ·{' '}
                  {item.course.ar}
                </span>
                <span className="text-muted">
                  {canPay && canFinance && item.amount !== null
                    ? formatMoney(item.amount / 100, item.currency)
                    : formatDate(item.at, {
                        dateStyle: 'medium',
                        timeZone: 'Africa/Cairo',
                      })}
                </span>
              </Link>
            ))
          ) : (
            <EmptyState title={t('workQueue.emptyPayments')} />
          )}
        </article>
        <article className={`${panel} xl:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">{t('workQueue.registrations')}</h2>
            <Link className="text-sm text-primary-strong underline" to="/admin/analytics">
              {t('workQueue.fullAnalytics')}
            </Link>
          </div>
          <div
            className="flex h-24 items-end gap-1"
            role="img"
            aria-label={t('workQueue.registrationsSparkline')}
          >
            {data.registrations14d.map((point) => (
              <span
                key={point.day}
                title={`${point.day}: ${point.count}`}
                className="min-w-1 flex-1 rounded-t bg-primary"
                style={{ height: `${Math.max(4, (point.count / maxCount) * 100)}%` }}
              />
            ))}
          </div>
          <p className="text-xs text-muted">
            {data.registrations14d[0]?.day} – {today}
          </p>
        </article>
        <article className={panel}>
          <h2 className="font-bold">{t('workQueue.latestRegistrations')}</h2>
          {data.registrations.length ? (
            data.registrations.map((item) => (
              <Link
                key={item.id}
                to={item.leadId ? `/admin/leads/${item.leadId}` : '/admin/leads'}
                className="flex flex-wrap justify-between gap-2 border-t border-border pt-3 text-sm"
              >
                <span>
                  {item.name || t('workQueue.registration')} ·{' '}
                  {item.course.ar}
                </span>
                <span className="text-muted">
                  {t(`workQueue.enrollmentStatus.${item.enrollmentStatus}`)} ·{' '}
                  {t(`workQueue.paymentStatus.${item.paymentStatus}`)}
                </span>
              </Link>
            ))
          ) : (
            <EmptyState title={t('workQueue.emptyRegistrations')} />
          )}
        </article>
        <article className={panel}>
          <h2 className="font-bold">{t('workQueue.recentActivity')}</h2>
          {data.activity.length ? (
            data.activity.map((item) => (
              <p key={item.id} className="border-t border-border pt-3 text-sm">
                <span>
                  {t(`audit:actions.${item.action.replaceAll('.', '_')}`, {
                    defaultValue: t('workQueue.activity'),
                  })}
                </span>
                <time className="ms-2 text-xs text-muted">
                  {formatDate(item.at, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                    timeZone: 'Africa/Cairo',
                  })}
                </time>
              </p>
            ))
          ) : (
            <EmptyState title={t('workQueue.emptyActivity')} />
          )}
        </article>
      </section>
    </main>
  );
}
