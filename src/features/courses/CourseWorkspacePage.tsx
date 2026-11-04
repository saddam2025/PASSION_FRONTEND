import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import { coursesService } from '@/services/courses';
import { CourseStudioShell, type CourseTab } from './studio/CourseStudioShell';
import { initialCoursePreviewWidth, type CoursePreviewWidth } from './previewWidth';
import { CoursePagePreview } from './CoursePagePreview';
import { SnapshotSchema } from '@/schemas/course';

export default function CourseWorkspacePage() {
  const { courseId: routeCourseId } = useParams();
  const { pathname, search } = useLocation();
  const courseId = routeCourseId ?? pathname.match(/^\/admin\/courses\/([^/]+)/)?.[1] ?? '';
  const { t, i18n } = useTranslation('courses');
  const [previewWidth, setPreviewWidth] = useState<CoursePreviewWidth>(initialCoursePreviewWidth);

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await coursesService.get(courseId);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
  });

  const rolePrefix = 'admin';
  const sectionId = pathname.match(/\/studio\/page\/([^/]+)$/)?.[1];
  const isRtl = i18n.language === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  if (courseQuery.isLoading) {
    return (
      <div className="grid gap-4 py-8">
        <Skeleton variant="card" className="h-20" />
        <Skeleton variant="card" className="h-96" />
      </div>
    );
  }

  if (courseQuery.isError || !courseQuery.data) {
    return (
      <div className="py-8">
        <ErrorState
          title={t('loadError', 'ما قدرناش نحمّل الكورس')}
          description={courseQuery.error?.message}
          onRetry={() => void courseQuery.refetch()}
        />
      </div>
    );
  }

  const course = courseQuery.data;

  // Handle معاينة sub-route
  if (pathname.endsWith('/preview')) {
    const workingCopyKey = new URLSearchParams(search).get('workingCopy');
    const rawWorkingCopy = workingCopyKey ? sessionStorage.getItem(`course-preview:${workingCopyKey}`) : null;
    let previewCourse = course;
    if (rawWorkingCopy) {
      try {
        const parsed = SnapshotSchema.safeParse(JSON.parse(rawWorkingCopy));
        if (parsed.success) previewCourse = { ...course, draft: parsed.data };
      } catch {
        // Invalid or unavailable working copies fall back to the persisted draft.
      }
    }
    return (
      <section className="grid gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to={`/${rolePrefix}/courses/${courseId}/studio/page`}
              className="grid size-9 place-items-center rounded-xs border border-border text-muted hover:bg-canvas hover:text-ink"
            >
              <BackArrow size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-ink">{t('previewPage', 'معاينة الكورس')}</h1>
              <p className="text-xs text-muted">/{course.slug}</p>
            </div>
          </div>
          <Link
            className="text-sm font-semibold text-primary-strong hover:underline"
            to={`/${rolePrefix}/courses/${courseId}/studio/page`}
          >
            {t('backToCourse', 'العودة للاستوديو')}
          </Link>
        </header>
        <div className="grid gap-3 px-4 pb-12">
          <div role="group" aria-label="مقاس المعاينة" className="flex justify-center gap-1">{([1200, 768, 375] as const).map((width) => <button key={width} type="button" aria-pressed={previewWidth === width} onClick={() => setPreviewWidth(width)} className={`min-h-9 rounded-xs border px-3 text-xs ${previewWidth === width ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-muted'}`}>{width}</button>)}</div>
          <div role="region" aria-label="معاينة صفحة الكورس" tabIndex={0} className="studio-horizontal-scroll mx-auto w-full min-w-0 max-w-full overscroll-x-contain rounded-sm border border-border bg-canvas p-2" style={{ maxWidth: previewWidth + 20 }}><div style={{ width: previewWidth, minWidth: previewWidth }}><CoursePagePreview course={previewCourse} editableOnly /></div></div>
        </div>
      </section>
    );
  }

  // Determine active tab
  let activeTab: CourseTab = 'page';
  if (pathname.includes('/studio/details') || pathname.endsWith('/edit')) {
    activeTab = 'details';
  } else if (pathname.includes('/studio/form')) {
    activeTab = 'form';
  } else if (pathname.includes('/studio/seo')) {
    activeTab = 'seo';
  } else if (pathname.includes('/studio/page') || pathname.endsWith('/builder')) {
    activeTab = 'page';
  } else {
    // If just /courses/:courseId, redirect to /courses/:courseId/studio/page
    return <Navigate to={`/${rolePrefix}/courses/${courseId}/studio/page`} replace />;
  }

  return (
    <CourseStudioShell
      course={course}
      activeTab={activeTab}
      sectionId={sectionId}
    />
  );
}

