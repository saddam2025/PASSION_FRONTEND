import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import { revisionsService } from '@/services/revisions';
import { coursesAdminService } from '@/services/courses.admin';
import { diffCourseDetails } from './diff/diffCourseDetails';
import { diffPageConfig } from './diff/diffPageConfig';
import type { CoursePageContextValue } from '@/features/sections/CoursePageContext';
import { ReviewDiffPanel } from './ReviewDiffPanel';
import { ReviewPreviewPanel } from './ReviewPreviewPanel';
import { mockPublicSettings } from '@/services/settings.mock';
import { useToast } from '@/components/ui/feedback';
import { checkReadiness } from '@/schemas/courseReadiness';

export function ReviewDetailPage() {
  const { revisionId = '' } = useParams();
  const { t } = useTranslation('review');
  const navigate = useNavigate();
  const client = useQueryClient();
  const { notify } = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['revision', revisionId],
    queryFn: () => revisionsService.get(revisionId),
  });
  const courseQuery = useQuery({
    queryKey: ['course', query.data?.courseId],
    enabled: Boolean(query.data),
    queryFn: () => coursesAdminService.getById(query.data!.courseId),
  });
  if (query.isLoading || courseQuery.isLoading) return <Skeleton variant="card" />;
  if (query.isError || !query.data || courseQuery.isError || !courseQuery.data)
    return <ErrorState title={t('loadError')} />;
  const revision = query.data;
  const course = courseQuery.data;
  const stale = course.publishedVersion !== revision.baseVersion;
  const details = diffCourseDetails(
    revision.kind === 'new_course' ? null : course.details,
    revision.snapshot.details,
  );
  const page = diffPageConfig(
    revision.kind === 'new_course' ? null : course.pageConfig,
    revision.snapshot.pageConfig,
  );
  const contextFor = (
    detailsSnapshot: typeof revision.snapshot.details,
  ): Omit<CoursePageContextValue, 'mode'> => ({
    course: {
      id: course.id,
      slug: detailsSnapshot.slug,
      title: detailsSnapshot.title,
      shortDescription: detailsSnapshot.shortDescription,
      price: detailsSnapshot.pricing.price,
      promoPrice: detailsSnapshot.pricing.promoPrice ?? null,
      currency: detailsSnapshot.pricing.currency,
      startDate: detailsSnapshot.schedule.startDate ?? '',
      registrationOpen: detailsSnapshot.enrollment.registrationOpen,
      accreditationVerified: detailsSnapshot.accreditation.verifiedByAcademy,
      instructor: detailsSnapshot.instructor,
      delivery: detailsSnapshot.delivery,
      schedule: detailsSnapshot.schedule,
      accreditation: {
        certificateType: detailsSnapshot.accreditation.certificateType,
        statement: detailsSnapshot.accreditation.statement,
        accreditingBody: detailsSnapshot.accreditation.accreditingBody,
      },
      whatsappMessageTemplate: detailsSnapshot.contact.whatsappMessageTemplate ?? {
        ar: '',
        en: '',
      },
    },
    settings: {
      academyName: mockPublicSettings.academyName,
      whatsappNumber: mockPublicSettings.whatsappNumber,
      phone: mockPublicSettings.phone,
      email: mockPublicSettings.email,
    },
    formDefinition: detailsSnapshot.registrationForm,
  });
  const readiness = checkReadiness(revision.snapshot);
  const act = async (action: 'approve' | 'reject') => {
    setError('');
    try {
      if (action === 'approve')
        await revisionsService.approve(
          revision.id,
          revision.kind === 'new_course' ? publishImmediately : true,
        );
      else {
        await revisionsService.reject(revision.id, reason);
        setRejectOpen(false);
      }
      await Promise.all([
        client.invalidateQueries({ queryKey: ['review-queue'] }),
        client.invalidateQueries({ queryKey: ['notifications'] }),
        client.invalidateQueries({ queryKey: ['unread-notifications'] }),
      ]);
      notify({
        title: t(action === 'approve' ? 'approvedToast' : 'rejectedToast'),
        tone: 'success',
      });
      navigate('/admin/review');
    } catch {
      setError(t('actionError'));
    }
  };
  return (
    <section className="grid gap-5">
      <header>
        <Link className="text-sm text-primary-strong underline" to="/admin/review">
          {t('backToQueue')}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {revision.snapshot.details.title.en || revision.snapshot.details.slug}
        </h1>
        <p className="text-sm text-muted">
          {t('baseVersion', { version: revision.baseVersion })} ·{' '}
          {t('currentVersion', { version: course.publishedVersion })}
        </p>
      </header>
      {stale && (
        <p role="alert" className="rounded-sm border border-danger/30 bg-danger/5 p-4">
          {t('stale')}
        </p>
      )}
      <ReviewDiffPanel details={details} page={page} />
      <ReviewPreviewPanel
        live={revision.kind === 'new_course' ? undefined : course.pageConfig}
        proposed={revision.snapshot.pageConfig}
        liveContext={revision.kind === 'new_course' ? undefined : contextFor(course.details)}
        proposedContext={contextFor(revision.snapshot.details)}
      />
      <Link
        className="inline-flex min-h-11 items-center underline"
        to={`/admin/courses/${course.id}/edit?revision=${revision.id}`}
      >
        {t('openProposedDetails')}
      </Link>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error === 'Revision is stale' ? t('stale') : error}
        </p>
      )}
      {revision.status === 'pending_review' ? (
        <footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-surface/95 p-3">
          {stale && (
            <Button
              variant="danger"
              onClick={() => {
                setReason(t('staleReason'));
                setRejectOpen(true);
              }}
            >
              {t('rejectStale')}
            </Button>
          )}
          <Button variant="secondary" onClick={() => setRejectOpen(true)}>
            {t('reject')}
          </Button>
          <Button
            disabled={stale || readiness.errors.length > 0}
            onClick={() => setApproveOpen(true)}
          >
            {t('approve')}
          </Button>
        </footer>
      ) : (
        <p role="status" className="rounded-sm border border-border bg-surface p-4">
          {t(`revisionStatuses.${revision.status}`)}
        </p>
      )}
      <Modal
        open={approveOpen && revision.status === 'pending_review'}
        onOpenChange={setApproveOpen}
        title={t('approve')}
        description={t(
          revision.kind === 'new_course' ? 'approveNewDescription' : 'approveUpdateDescription',
        )}
        footer={
          <>
            <Button variant="secondary" onClick={() => setApproveOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              disabled={stale || readiness.errors.length > 0}
              onClick={() => {
                setApproveOpen(false);
                void act('approve');
              }}
            >
              {t('approve')}
            </Button>
          </>
        }
      >
        {revision.kind === 'new_course' && (
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={publishImmediately}
              onChange={(event) => setPublishImmediately(event.target.checked)}
            />
            {t('publishImmediately')}
          </label>
        )}
        {readiness.errors.length > 0 && (
          <p className="text-sm text-danger">
            {t('readinessBlocks', { count: readiness.errors.length })}
          </p>
        )}
      </Modal>
      <Modal
        open={rejectOpen && revision.status === 'pending_review'}
        onOpenChange={setRejectOpen}
        title={t('reject')}
        description={t('rejectHint')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={reason.trim().length < 10 || reason.length > 1000}
              onClick={() => void act('reject')}
            >
              {t('confirmReject')}
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {['pricing', 'translation', 'image'].map((key) => (
            <button
              key={key}
              type="button"
              className="min-h-10 rounded-pill border border-border px-3 text-xs"
              onClick={() => setReason(t(`quickReasons.${key}`))}
            >
              {t(`quickReasons.${key}`)}
            </button>
          ))}
        </div>
        <textarea
          aria-label={t('reason')}
          className="min-h-32 rounded-sm border border-border p-3"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={1000}
        />
        <p className="text-end text-xs text-muted">{reason.length}/1000</p>
      </Modal>
    </section>
  );
}
