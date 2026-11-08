import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SmartImage } from '@/components/common/SmartImage';
import { MicroInteraction } from '@/components/common/motion';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import type { CourseSummary } from '@/services/courses.types';
import { formatPrice } from './format';
import { formatDate } from '@/lib/formatters';
export function CourseCard({ course }: { course: CourseSummary }) {
  const { language } = useLanguage();
  const { t } = useTranslation('courses');
  const text = (x: { ar: string; en: string }) => getBilingualText(x, language);
  const price = course.promoPrice ?? course.price;
  return (
    <MicroInteraction className="h-full">
      <article className="h-full overflow-hidden rounded-md border border-border bg-surface transition hover:shadow-card">
        <Link
          to={`/${language}/courses/${course.slug}`}
          className="grid h-full content-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <SmartImage
            slot="course-cover-default"
            alt={course.coverImage.decorative ? '' : text(course.coverImage.alt)}
            srcOverride={course.coverImage.src}
            width={600}
            height={375}
            className="aspect-[8/5] w-full"
          />
          <div className="grid gap-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-primary/10 ps-3 pe-3 py-1 text-xs font-semibold text-primary-strong">
                {text(course.category)}
              </span>
              {course.deliveryMethod && (
                <span className="text-xs text-muted">{t(`delivery.${course.deliveryMethod}`)}</span>
              )}
            </div>
            <h3 className="line-clamp-2 text-lg font-bold">{text(course.title)}</h3>
            {course.shortDescription.ar ? (
              <p className="line-clamp-3 text-sm text-muted">{text(course.shortDescription)}</p>
            ) : null}
            {course.instructorName.ar && (
              <p className="text-sm text-muted">
                {t('instructor')}: {text(course.instructorName)}
              </p>
            )}
            {price !== null ? (
              <p className="font-bold text-primary-strong">
                {formatPrice(price, course.currency, language)}
                {course.promoPrice !== null && course.price !== null && (
                  <del className="ms-2 text-sm font-normal text-muted">
                    {formatPrice(course.price, course.currency, language)}
                  </del>
                )}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 text-xs text-muted">
              {course.startDate && (
                <time dateTime={course.startDate}>
                  {formatDate(course.startDate)}
                </time>
              )}
              {course.duration.ar && <span>{text(course.duration)}</span>}
            </div>
            <span className="mt-1 font-semibold text-primary-strong">{t('viewDetails')}</span>
          </div>
        </Link>
      </article>
    </MicroInteraction>
  );
}
