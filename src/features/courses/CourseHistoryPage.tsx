import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseRecord } from '@/schemas/course';
import { useAuth } from '@/app/AuthContext';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton, useToast } from '@/components/ui/feedback';
import { Modal } from '@/components/ui/Overlay';
import { revisionsService } from '@/services/revisions';
export function CourseHistoryPage({
  course,
  assistant,
}: {
  course: CourseRecord;
  assistant: boolean;
}) {
  const { t } = useTranslation('courses');
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['revisions', course.id],
    queryFn: () => revisionsService.listForCourse(course.id),
  });
  const [restoreId, setRestoreId] = useState('');
  const client = useQueryClient();
  const { notify } = useToast();
  const rollback = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      revisionsService.rollbackTo(id, publish),
    onSuccess: async (_, variables) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['revisions', course.id] }),
        client.invalidateQueries({ queryKey: ['course', course.id] }),
      ]);
      notify({
        title: t(variables.publish ? 'rollbackPublished' : 'rollbackDraft'),
        tone: 'success',
      });
      setRestoreId('');
    },
  });
  if (query.isLoading) return <Skeleton variant="card" />;
  if (!query.data?.length)
    return <EmptyState title={t('historyEmpty')} description={t('historyDescription')} />;
  return (
    <section className="grid gap-4">
      <header>
        <h2 className="text-xl font-bold">{t('history')}</h2>
        <p className="text-sm text-muted">
          {t('publishedVersion', { version: course.publishedVersion })}
        </p>
      </header>
      <ol className="grid gap-3 border-s border-border ps-5">
        {query.data.map((revision) => (
          <li key={revision.id} className="relative rounded-sm border border-border bg-surface p-4">
            <span
              aria-hidden="true"
              className="absolute -start-[1.65rem] top-5 size-3 rounded-full border-2 border-primary bg-surface"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{t(`revisionStatuses.${revision.status}`)}</p>
                <p className="text-sm text-muted">
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(revision.createdAt))}
                </p>
                {revision.rejectionReason && (
                  <p className="mt-2 text-sm text-danger">{revision.rejectionReason}</p>
                )}
              </div>
              <span className="text-xs text-muted">
                {t(revision.kind === 'new_course' ? 'newCourse' : 'revisionUpdate')}
              </span>
            </div>
            {user?.role === 'admin' && !assistant && revision.status !== 'pending_review' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => window.location.assign(`/admin/review/${revision.id}`)}
                >
                  {t('previewVersion')}
                </Button>
                {revision.status === 'approved' && (
                  <Button variant="secondary" onClick={() => setRestoreId(revision.id)}>
                    {t('restoreVersion')}
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
      <Modal
        open={Boolean(restoreId)}
        onOpenChange={(open) => !open && setRestoreId('')}
        title={t('restoreVersion')}
        description={t('restoreDescription')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRestoreId('')}>
              {t('cancel')}
            </Button>
            <Button
              variant="secondary"
              disabled={rollback.isPending}
              onClick={() => void rollback.mutateAsync({ id: restoreId, publish: false })}
            >
              {t('restoreAsDraft')}
            </Button>
            <Button
              disabled={rollback.isPending}
              onClick={() => void rollback.mutateAsync({ id: restoreId, publish: true })}
            >
              {t('restoreAndPublish')}
            </Button>
          </>
        }
      />
    </section>
  );
}
