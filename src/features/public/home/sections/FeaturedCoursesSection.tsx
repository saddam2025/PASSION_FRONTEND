import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Frame } from './shared';
import type { CourseSummary } from '@/services/courses.types';
import { CourseCard } from '@/features/public/courses/CourseCard';
import { useLanguage } from '@/i18n/useLanguage';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
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
  if (loading) return <div className="ps-container pe-container grid grid-cols-1 gap-5 py-8 sm:grid-cols-2 lg:grid-cols-3" aria-label="جاري تحميل الكورسات">{[1, 2, 3].map((index) => <Skeleton key={index} variant="card" className="h-72" />)}</div>;
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
