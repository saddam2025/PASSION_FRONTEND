import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Frame } from './shared';
import { useSectionText } from './content';
import type { HomeSection } from '@/services/siteContent';
import type { CourseSummary } from '@/services/courses.types';
import { CourseCard } from '@/features/public/courses/CourseCard';
import { useLanguage } from '@/i18n/useLanguage';
export function FeaturedCoursesSection({
  section,
  courses,
}: {
  section: HomeSection;
  courses: CourseSummary[];
}) {
  const { language } = useLanguage();
  const { title } = useSectionText(section);
  const { t } = useTranslation('courses');
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
