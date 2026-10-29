import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { CourseRecord } from '@/schemas/course';
import { coursesAdminService } from '@/services/courses.admin';
import { revisionsService } from '@/services/revisions';
import { checkReadiness } from '@/schemas/courseReadiness';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/feedback';
import { useLanguage } from '@/i18n/useLanguage';
import { Modal } from '@/components/ui/Overlay';
import { CourseEditorPanels } from './editor/CourseEditorPanels';
import { useAuth } from '@/app/AuthContext';

export function CourseEditorPage({
  course,
  assistant,
}: {
  course: CourseRecord;
  assistant: boolean;
}) {
  const { courseId = '' } = useParams();
  const [params] = useSearchParams();
  const [details, setDetails] = useState(course.details);
  const [revisionId, setRevisionId] = useState(params.get('revision') ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [discardOpen, setDiscardOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const { t } = useTranslation('courses');
  const { language } = useLanguage();
  const client = useQueryClient();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { user } = useAuth();
  const courseRevisions = useQuery({
    queryKey: ['revisions', courseId],
    queryFn: () => revisionsService.listForCourse(courseId),
  });
  const pending = course.status === 'pending_review' || Boolean(courseRevisions.data?.some((item) => item.status === 'pending_review'));
  const editableRevision = useQuery({
    queryKey: ['editable-revision', courseId],
    enabled: !revisionId && !pending,
    queryFn: () => revisionsService.ensureEditableRevision(course),
  });
  const revision = useQuery({
    queryKey: ['revision', revisionId],
    enabled: Boolean(revisionId),
    queryFn: () => revisionsService.get(revisionId),
  });
  useEffect(() => {
    if (revision.data) setDetails(revision.data.snapshot.details);
  }, [revision.data]);
  useEffect(() => {
    if (!revisionId && editableRevision.data) setDetails(editableRevision.data.snapshot.details);
  }, [editableRevision.data, revisionId]);
  const workingSnapshot = revision.data?.snapshot ?? editableRevision.data?.snapshot;
  const dirty =
    JSON.stringify(details) !== JSON.stringify(workingSnapshot?.details ?? course.details);
  const blocker = useBlocker(dirty && !pending);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  const mutate = useMutation({
    mutationFn: async () => {
      if (course.publishedVersion > 0 || revisionId || editableRevision.data) {
        let id = revisionId || editableRevision.data?.id || '';
        if (!id) id = (await revisionsService.ensureEditableRevision(course)).id;
        setRevisionId(id);
        await revisionsService.save(id, details, workingSnapshot?.pageConfig ?? course.pageConfig, course.publishedVersion);
        return id;
      }
      await coursesAdminService.saveDetails(courseId, {
        details,
        baseVersion: course.publishedVersion,
        baseUpdatedAt: course.updatedAt,
      });
      return '';
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['course', courseId] }),
        client.invalidateQueries({ queryKey: ['revisions', courseId] }),
        client.invalidateQueries({ queryKey: ['admin-courses'] }),
      ]);
      notify({ title: t('saved'), tone: 'success' });
    },
    onError: (error) => {
      setMessage(t('saveError'));
      if ('code' in error && error.code === 'stale') setConflictOpen(true);
    },
  });
  const submit = async () => {
    setBusy(true);
    setMessage('');
    try {
      await mutate.mutateAsync();
      if (!revisionId && course.publishedVersion) setRevisionId('');
      const revId =
        revisionId || (await revisionsService.ensureEditableRevision({ ...course, details })).id;
      await revisionsService.submit(revId);
      await client.invalidateQueries({ queryKey: ['course', courseId] });
      navigate(assistant ? '/assistant/submissions' : `/admin/courses/${courseId}`);
    } catch {
      setMessage(t('submitError'));
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    if (readiness.errors.length || !window.confirm(t('publishConfirm'))) return;
    setBusy(true);
    setMessage('');
    try {
      await mutate.mutateAsync();
      await coursesAdminService.publishDirect(courseId);
      await Promise.all([client.invalidateQueries({ queryKey: ['course', courseId] }), client.invalidateQueries({ queryKey: ['revisions', courseId] }), client.invalidateQueries({ queryKey: ['admin-courses'] })]);
      setMessage(t('publishSuccess'));
      notify({ title: t('publishSuccess'), tone: 'success', action: { label: t('viewLive'), href: `/${language}/courses/${course.details.slug}` } });
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : undefined;
      setMessage(code === 'pending_assistant_revision' ? t('pendingAssistantRevision') : t('publishError'));
    } finally { setBusy(false); }
  };
  const readiness = checkReadiness({ details, pageConfig: course.pageConfig });
  if (revision.isLoading || courseRevisions.isLoading || (!revisionId && !pending && editableRevision.isLoading))
    return (
      <p role="status" className="rounded-sm border border-border bg-surface p-4">
        {t('loadingRevision')}
      </p>
    );
  return (
    <section className="grid gap-5">
      <header>
        <p className="text-sm text-muted">
          <Link
            className="underline"
            to={`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}`}
          >
            {t('backToCourse')}
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-bold">{t('editCourse')}</h1>
      </header>
      {course.publishedVersion > 0 && (
        <div role="status" className="rounded-sm border border-info/30 bg-info/5 p-4 text-sm">
          {t(pending ? 'pendingReadOnly' : 'revisionBanner')}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
        <nav className="grid content-start gap-2 lg:sticky lg:top-20 lg:self-start">
          {[
            'basics',
            'instructor',
            'media',
            'schedule',
            'pricing',
            'enrollment',
            'accreditation',
            'requirements',
            'registrationForm',
            'contact',
            'seo',
          ].map((item) => (
            <a
              key={item}
              className="min-h-11 rounded-sm px-3 py-3 text-start text-sm hover:bg-surface"
              href={`#${item}`}
            >
              {t(`sections.${item}`)}
            </a>
          ))}
        </nav>
        <CourseEditorPanels
          details={details}
          setDetails={setDetails}
          pending={pending}
          language={language}
          course={course}
        />
      </div>
      <footer className="sticky bottom-16 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface/95 p-3 shadow-elevated backdrop-blur lg:bottom-0">
        <span aria-live="polite" className="text-sm text-muted">
          {message || (dirty ? t('unsaved') : t('savedState'))}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              dirty
                ? setDiscardOpen(true)
                : navigate(`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}`)
            }
          >
            {t('discard')}
          </Button>
          <Button
            variant="secondary"
            disabled={!dirty || pending || mutate.isPending}
            onClick={() => void mutate.mutateAsync()}
          >
            {mutate.isPending ? t('saving') : t('saveDraft')}
          </Button>
          {user?.role === 'admin' ? (
            <Button disabled={busy || mutate.isPending || pending} onClick={() => void publish()}>{t(course.status === 'published' ? 'publishChanges' : 'publish')}</Button>
          ) : (
            <Button disabled={busy || mutate.isPending || pending || readiness.errors.length > 0} onClick={() => void submit()}>{t('submitReview')}</Button>
          )}
        </div>
      </footer>
      {message === t('publishSuccess') && <p role="status" className="text-sm"><a className="underline" href={`/${language}/courses/${course.details.slug}`} target="_blank" rel="noreferrer">{t('viewLive')}</a></p>}
      {message === t('pendingAssistantRevision') && <p role="alert" className="text-sm"><Link className="underline" to={`/admin/review/${courseRevisions.data?.find((item) => item.status === 'pending_review')?.id ?? ''}`}>{t('reviewSubmission')}</Link></p>}
      {readiness.errors.length > 0 && (
        <aside className="rounded-sm border border-warning/30 bg-warning/5 p-4">
          <h2 className="font-semibold">
            {t('readinessErrors', { count: readiness.errors.length })}
          </h2>
          <ul className="mt-2 grid gap-1 text-sm">
            {readiness.errors.slice(0, 6).map((issue) => (
              <li key={issue.path}>
                {t('readinessItem', { field: issue.path })}{' '}
                <a className="underline" href={`#${issue.path.split('.')[0]}`}>
                  {t('goTo')}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
      <Modal
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={t('discard')}
        description={t('discardChangesPrompt')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDiscardOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => navigate(`/${assistant ? 'assistant' : 'admin'}/courses/${courseId}`)}
            >
              {t('discard')}
            </Button>
          </>
        }
      />
      <Modal
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => { if (!open && blocker.state === 'blocked') blocker.reset?.(); }}
        title={t('discard')}
        description={t('discardChangesPrompt')}
        footer={<><Button variant="secondary" onClick={() => blocker.reset?.()}>{t('cancel')}</Button><Button variant="danger" onClick={() => blocker.proceed?.()}>{t('discard')}</Button></>}
      />
      <Modal
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        title={t('conflictTitle')}
        description={t('conflictDescription')}
        footer={
          <Button
            onClick={() => {
              setConflictOpen(false);
              void client.invalidateQueries({ queryKey: ['course', courseId] });
            }}
          >
            {t('refreshCourse')}
          </Button>
        }
      />
    </section>
  );
}
