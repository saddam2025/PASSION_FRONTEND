import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Frame } from './shared';
import type { CourseSummary } from '@/services/courses.types';
import { CourseCard } from '@/features/public/courses/CourseCard';
import { useLanguage } from '@/i18n/useLanguage';
import { ErrorState } from '@/components/ui/feedback';
export function FeaturedCoursesSection({
  title,
  courses,
  loading = false,
  error = false,
  onRetry,
}: {
  title: string;
  courses: CourseSummary[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const { language } = useLanguage();
  const { t } = useTranslation('courses');
  if (error) return <div className="ps-container pe-container py-8"><ErrorState title="حصلت مشكلة في تحميل الكورسات، جرّب تاني." onRetry={onRetry} /></div>;
  if (loading) return <Frame id="courses" title={title}><div role="status" aria-live="polite" className="rounded-md border border-border bg-surface p-5 text-sm text-muted">جاري تحميل الكورسات المتاحة.</div></Frame>;
  if (!courses.length) return null;
  return (
    <Frame id="courses" title={title}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <CourseCard key={c.slug} course={c} />
        ))}
      </div>
      <Link
        to={`/${language}/courses`}
        className="mt-8 inline-flex min-h-11 items-center font-semibold text-primary-strong underline"
      >
        {t('viewAll')}
      </Link>
    </Frame>
  );
}
