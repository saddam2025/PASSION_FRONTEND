import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, BookOpen, CheckCircle2, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { notificationsService, type NotificationItem } from '@/services/notifications';
import { formatDate } from '@/lib/formatters';
const icons = {
  course_submitted: BookOpen,
  course_withdrawn: BookOpen,
  course_published: CheckCircle2,
  course_unpublished: Bell,
  revision_approved: CheckCircle2,
  revision_rejected: CheckCircle2,
  course_deletion_requested: Trash2,
  course_deletion_approved: CheckCircle2,
  course_deletion_rejected: CheckCircle2,
  new_registration: Bell,
  payment_recorded: CreditCard,
} satisfies Record<NotificationItem['type'], typeof Bell>;
export default function NotificationsPage({ assistant = false }: { assistant?: boolean }) {
  const { t } = useTranslation('notifications');
  const [unread, setUnread] = useState(false);
  const [page, setPage] = useState(1);
  const client = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['notifications', unread, page],
    queryFn: () => notificationsService.list({ unread, page, pageSize: 15 }),
  });
  const open = async (item: NotificationItem) => {
    await notificationsService.markRead(item.id);
    await client.invalidateQueries({ queryKey: ['notifications'] });
    navigate(
      assistant
        ? `/assistant/courses/${item.courseId ?? item.entityId}`
        : `/admin/review/${item.entityId}`,
    );
  };
  const markAll = async () => {
    await notificationsService.markAllRead();
    await client.invalidateQueries({ queryKey: ['notifications'] });
  };
  if (query.isLoading) return <Skeleton variant="card" />;
  if (query.isError)
    return <ErrorState title={t('loadError')} onRetry={() => void query.refetch()} />;
  return (
    <section className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted">{t('description')}</p>
        </div>
        <Button variant="secondary" onClick={() => void markAll()}>
          {t('markAllRead')}
        </Button>
      </header>
      <div className="flex gap-2">
        <Button
          variant={!unread ? 'primary' : 'secondary'}
          onClick={() => {
            setUnread(false);
            setPage(1);
          }}
        >
          {t('all')}
        </Button>
        <Button
          variant={unread ? 'primary' : 'secondary'}
          onClick={() => {
            setUnread(true);
            setPage(1);
          }}
        >
          {t('unread')}
        </Button>
      </div>
      {query.data?.items.length ? (
        <ul className="grid gap-2">
          {query.data.items.map((item) => {
            const Icon = icons[item.type];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void open(item)}
                  className="flex min-h-16 w-full items-center gap-3 rounded-sm border border-border bg-surface p-4 text-start hover:border-primary"
                >
                  <Icon aria-hidden="true" className="shrink-0 text-primary" size={20} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{t(`types.${item.type}`)}</span>
                    <time className="text-sm text-muted">
                      {formatDate(item.createdAt, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </time>
                  </span>
                  {!item.readAt && (
                    <span className="size-2 rounded-full bg-primary" aria-label={t('unread')} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title={t('empty')} description={t('emptyDescription')} />
      )}
      {(query.data?.pageCount ?? 0) > 1 && (
        <div className="flex justify-between">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            {t('previous')}
          </Button>
          <span className="self-center text-sm text-muted">
            {t('page', { page, pages: query.data?.pageCount })}
          </span>
          <Button
            variant="secondary"
            disabled={page >= (query.data?.pageCount ?? 1)}
            onClick={() => setPage((value) => value + 1)}
          >
            {t('next')}
          </Button>
        </div>
      )}
    </section>
  );
}
