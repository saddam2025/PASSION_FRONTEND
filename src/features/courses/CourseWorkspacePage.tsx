import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { coursesAdminService } from '@/services/courses.admin';
import { revisionsService } from '@/services/revisions';
import { CourseEditorPage } from './CourseEditorPage';
import { CourseHistoryPage } from './CourseHistoryPage';
import { checkReadiness } from '@/schemas/courseReadiness';
import { useLanguage } from '@/i18n/useLanguage';
import { useAuth } from '@/app/AuthContext';
import { useState } from 'react';
import { CourseBuilderPage } from './CourseBuilderPage';
import { CoursePagePreview } from './CoursePagePreview';
import { CourseDeleteDialog } from './CourseDeleteDialog';
import { CourseStudioLayout } from './CourseStudioLayout';

export default function CourseWorkspacePage({ assistant = false }: { assistant?: boolean }) {
  const { courseId = '' } = useParams();
  const { pathname } = useLocation();
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typedSlug, setTypedSlug] = useState('');
  const client = useQueryClient();
  const toast = useToast();
  const course = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesAdminService.getById(courseId),
  });
  const revisions = useQuery({
    queryKey: ['revisions', courseId],
    queryFn: () => revisionsService.listForCourse(courseId),
  });
  const usage = useQuery({
    queryKey: ['course-usage', courseId],
    enabled: deleteOpen && user?.role === 'admin',
    queryFn: () => coursesAdminService.usage(courseId),
  });
  if (course.isLoading) return <Skeleton variant="card" />;
  if (course.isError || !course.data)
    return <ErrorState title={t('loadError')} onRetry={() => void course.refetch()} />;
  const studioPending = Boolean(revisions.data?.some((item) => item.status === 'pending_review'));
  if (pathname.endsWith('/edit'))
    return <CourseStudioLayout course={course.data} assistant={assistant} pending={studioPending}><CourseEditorPage course={course.data} assistant={assistant} /></CourseStudioLayout>;
  if (pathname.endsWith('/builder') || pathname.endsWith('/studio'))
    return <CourseStudioLayout course={course.data} assistant={assistant} pending={studioPending}><CourseBuilderPage course={course.data} assistant={assistant} /></CourseStudioLayout>;
  if (pathname.endsWith('/preview'))
    return (
      <section className="grid gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t('previewPage')}</h1>
          <Link
            className="underline"
            to={`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}`}
          >
            {t('backToCourse')}
          </Link>
        </header>
        <CoursePagePreview course={course.data} />
      </section>
    );
  if (pathname.endsWith('/history'))
    return <CourseHistoryPage course={course.data} assistant={assistant} />;
  const latestPending = revisions.data?.find((item) => item.status === 'pending_review');
  if (!pathname.endsWith('/edit') && !pathname.endsWith('/preview') && !pathname.endsWith('/history'))
    return <Navigate to={`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}/studio`} replace />;
  const latestRejected = revisions.data?.find((item) => item.status === 'rejected');
  const readiness = checkReadiness({
    details: course.data.details,
    pageConfig: course.data.pageConfig,
  });
  const startEdit = async () => {
    const revision = await revisionsService.ensureEditableRevision(course.data!);
    navigate(
      `/${assistant ? 'assistant' : 'admin'}/courses/${courseId}/edit${course.data!.publishedVersion ? `?revision=${revision.id}` : ''}`,
    );
  };
  const submitForReview = async () => {
    try {
      if (readiness.errors.length) return;
      const revision = await revisionsService.ensureEditableRevision(course.data);
      await revisionsService.submit(revision.id);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['revisions', courseId] }),
        client.invalidateQueries({ queryKey: ['course', courseId] }),
      ]);
      toast.notify({ title: t('submittedForReview'), tone: 'success' });
    } catch {
      toast.notify({ title: t('submitError'), tone: 'danger' });
    }
  };
  const publishPending = async () => {
    if (!latestPending || latestPending.authorId === user?.id || readiness.errors.length) return;
    try {
      await revisionsService.approve(latestPending.id, true);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['revisions', courseId] }),
        client.invalidateQueries({ queryKey: ['course', courseId] }),
        client.invalidateQueries({ queryKey: ['admin-courses'] }),
      ]);
      toast.notify({ title: t('publishSuccess'), tone: 'success' });
    } catch {
      toast.notify({ title: t('publishError'), tone: 'danger' });
    }
  };
  const archive = async () => {
    await coursesAdminService.archive(courseId);
    await client.invalidateQueries({ queryKey: ['admin-courses'] });
    navigate(`/${assistant ? 'assistant' : 'admin'}/courses`);
  };
  const unpublish = async () => {
    try {
      await coursesAdminService.unpublish(courseId);
      await Promise.all([client.invalidateQueries({ queryKey: ['course', courseId] }), client.invalidateQueries({ queryKey: ['admin-courses'] })]);
      toast.notify({ title: t('unpublished'), tone: 'success' });
    } catch {
      toast.notify({ title: t('publishError'), tone: 'danger' });
    }
  };
  const remove = async () => {
    const outcome = await coursesAdminService.remove(courseId);
    await client.invalidateQueries({ queryKey: ['admin-courses'] });
    toast.notify({
      title: t(outcome.softDeleted ? 'softDeleteSuccess' : 'deleteSuccess'),
      tone: 'success',
    });
    setDeleteOpen(false);
    navigate(`/${assistant ? 'assistant' : 'admin'}/courses`);
  };
  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {course.data.details.title[language] || course.data.details.slug}
          </h1>
          <p className="mt-1 text-sm text-muted">/{course.data.details.slug}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-pill bg-canvas px-3 py-1 text-sm">
              {t(`statuses.${course.data.status}`)}
            </span>
            {latestPending && (
              <span className="rounded-pill bg-warning/10 px-3 py-1 text-sm text-warning">
                {t('revisionPending')}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void startEdit()} disabled={Boolean(latestPending)}>
            {latestPending ? t('pendingReadOnly') : t('editCourse')}
          </Button>
          {user?.role === 'admin' && latestPending && latestPending.authorId !== user.id && (
            <Button onClick={() => navigate(`/admin/review/${latestPending.id}`)}>
              {t('reviewAndPublish')}
            </Button>
          )}
          {user?.role === 'assistant' && (
            <Button
              variant="secondary"
              onClick={() => void submitForReview()}
              disabled={Boolean(latestPending) || readiness.errors.length > 0}
            >
              {t('submitForReview')}
            </Button>
          )}
          {user?.role === 'admin' && (
            <Button
              onClick={() => void publishPending()}
              disabled={
                !latestPending || latestPending.authorId === user.id || readiness.errors.length > 0
              }
            >
              {t('publish')}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() =>
              navigate(`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}/builder`)
            }
          >
            {t('openBuilder')}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              navigate(`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}/preview`)
            }
          >
            {t('previewPage')}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              void navigator.clipboard
                .writeText(
                  `${window.location.origin}/${language}/courses/${course.data.details.slug}`,
                )
                .then(() => toast.notify({ title: t('publicUrlCopied'), tone: 'success' }))
                .catch(() => toast.notify({ title: t('copyFailed'), tone: 'danger' }))
            }
          >
            {t('copyPublicUrl')}
          </Button>
          {course.data.status === 'published' && (
            <a
              className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-sm font-semibold"
              href={`/${language}/courses/${course.data.details.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('viewLive')}
            </a>
          )}
          {user?.role === 'admin' && (
            <>
              {course.data.status === 'published' && <Button variant="secondary" onClick={() => void unpublish()}>{t('unpublish')}</Button>}
              {course.data.status !== 'archived' ? (
                <Button variant="secondary" onClick={() => void archive()}>
                  {t('archive')}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() =>
                    void coursesAdminService
                      .unarchive(courseId)
                      .then(() => client.invalidateQueries({ queryKey: ['course', courseId] }))
                  }
                >
                  {t('unarchive')}
                </Button>
              )}
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                {t('deleteCourse')}
              </Button>
            </>
          )}
        </div>
      </header>
      {course.data.status === 'published' && (
        <div role="status" className="rounded-sm border border-info/30 bg-info/5 p-4 text-sm">
          {t('revisionBanner')}
        </div>
      )}
      {latestPending && (
        <div role="status" className="rounded-sm border border-warning/30 bg-warning/5 p-4 text-sm">
          {t('pendingReviewBanner')}{' '}
          {user?.role === 'admin' && (
            <Link className="ms-2 underline" to={`/admin/review/${latestPending.id}`}>
              {t('reviewSubmission')}
            </Link>
          )}
        </div>
      )}
      {latestRejected && (
        <div role="alert" className="rounded-sm border border-danger/30 bg-danger/5 p-4 text-sm">
          <p>{t('rejectedBanner')}</p>
          {latestRejected.rejectionReason && (
            <p className="mt-2">{latestRejected.rejectionReason}</p>
          )}
          <Button className="mt-3" onClick={() => void startEdit()}>
            {t('startRevising')}
          </Button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-md border border-border bg-surface p-5">
          <h2 className="font-bold">{t('readiness')}</h2>
          <p className="mt-2 text-2xl font-bold">
            {readiness.errors.length === 0
              ? t('ready')
              : t('errorCount', { count: readiness.errors.length })}
          </p>
          <ul className="mt-3 grid gap-2 text-sm">
            {readiness.errors.slice(0, 4).map((issue) => (
              <li key={issue.path}>
                <Link
                  className="text-danger underline"
                  to={`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}/edit#${issue.path}`}
                >
                  {t('readinessItem', { field: issue.path })}
                </Link>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-md border border-border bg-surface p-5">
          <h2 className="font-bold">{t('details')}</h2>
          <p className="mt-2 text-sm text-muted">{course.data.details.category}</p>
          <p className="mt-1 text-sm text-muted">
            {t('publishedVersion', { version: course.data.publishedVersion })}
          </p>
        </article>
        <article className="rounded-md border border-border bg-surface p-5">
          <h2 className="font-bold">{t('page')}</h2>
          <p className="mt-2 text-sm text-muted">
            {t('sectionCount', { count: course.data.pageConfig.sections.length })}
          </p>
        </article>
      </div>
      <nav className="flex gap-2 border-b border-border">
        <Link
          className="p-3 text-primary-strong"
          to={`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}`}
        >
          {t('overview')}
        </Link>
        <Link className="p-3" to={`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}/edit`}>
          {t('details')}
        </Link>
        <Link
          className="p-3"
          to={`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}/history`}
        >
          {t('history')}
        </Link>
        <Link
          className="p-3"
          to={`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}/builder`}
        >
          {t('page')}
        </Link>
      </nav>
      <CourseDeleteDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setTypedSlug('');
        }}
        slug={course.data.details.slug}
        typedSlug={typedSlug}
        onSlugChange={setTypedSlug}
        enrollmentCount={usage.data?.enrollmentCount ?? 0}
        paymentCount={usage.data?.paymentCount ?? 0}
        loading={usage.isLoading}
        onConfirm={() => void remove()}
      />
    </section>
  );
}
