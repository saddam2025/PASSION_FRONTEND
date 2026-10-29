import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { revisionsService } from '@/services/revisions';

export default function ReviewQueuePage() {
  const { t } = useTranslation('review');
  const [params, setParams] = useSearchParams();
  const status = params.get('status') === 'rejected' ? 'rejected' : 'pending_review';
  const query = useQuery({
    queryKey: ['review-queue', status],
    queryFn: () => revisionsService.listQueue(status),
  });
  if (query.isLoading) return <Skeleton variant="card" />;
  if (query.isError)
    return <ErrorState title={t('loadError')} onRetry={() => void query.refetch()} />;
  return (
    <section className="grid gap-4">
      <header>
        <h1 className="text-2xl font-bold">{t('queue')}</h1>
        <p className="text-sm text-muted">{t('queueDescription')}</p>
        <label className="mt-3 grid max-w-xs gap-1 text-sm">
          <span>{t('queueStatus')}</span>
          <select
            className="min-h-11 rounded-xs border border-border bg-surface px-3"
            value={status}
            onChange={(event) =>
              setParams(event.target.value === 'rejected' ? { status: 'rejected' } : {})
            }
          >
            <option value="pending_review">{t('pending')}</option>
            <option value="rejected">{t('rejected')}</option>
          </select>
        </label>
      </header>
      {query.data?.length ? (
        <div className="grid gap-3">
          {query.data.map((revision) => (
            <Link
              key={revision.id}
              to={`/admin/review/${revision.id}`}
              className="grid gap-2 rounded-md border border-border bg-surface p-4 hover:border-primary sm:grid-cols-[1fr_auto]"
            >
              <span className="font-semibold">
                {revision.snapshot.details.title.en || revision.snapshot.details.slug}
                <small className="mt-1 block font-normal text-muted">
                  {t(revision.kind === 'new_course' ? 'newCourse' : 'update')} ·{' '}
                  {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                    new Date(revision.submittedAt ?? revision.createdAt),
                  )}
                </small>
                <small className="mt-1 block font-normal text-muted">
                  {t('changeCounts', {
                    details: revision.summary.detailsChanged,
                    sections: revision.summary.sectionsChanged,
                  })}
                </small>
              </span>
              <span className="rounded-pill bg-canvas px-3 py-1 text-sm">
                {t('baseVersion', { version: revision.baseVersion })}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={t('empty')} description={t('emptyDescription')} />
      )}
    </section>
  );
}
