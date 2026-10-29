import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DropdownMenu } from '@/components/ui/Overlay';
import { SmartImage } from '@/components/common/SmartImage';
import { useLanguage } from '@/i18n/useLanguage';
import type { coursesAdminService } from '@/services/courses.admin';

export type CourseListItem = Awaited<ReturnType<typeof coursesAdminService.list>>['items'][number];
export function CourseListEntries({
  items,
  assistant,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  items: CourseListItem[];
  assistant: boolean;
  onArchive: (course: CourseListItem) => void;
  onUnarchive: (course: CourseListItem) => void;
  onDelete: (course: CourseListItem) => void;
}) {
  const { t } = useTranslation('courses');
  const { language } = useLanguage();
  const navigate = useNavigate();
  const area = assistant ? 'assistant' : 'admin';
  const titleFor = (course: CourseListItem) =>
    course.details.title[language] ||
    course.details.title[language === 'ar' ? 'en' : 'ar'] ||
    course.details.slug;
  const actions = (course: CourseListItem) => [
    { label: t('editCourse'), onSelect: () => navigate(`/${area}/courses/${course.id}/edit`) },
    { label: t('openBuilder'), onSelect: () => navigate(`/${area}/courses/${course.id}/builder`) },
    { label: t('history'), onSelect: () => navigate(`/${area}/courses/${course.id}/history`) },
    ...(course.status === 'published'
      ? [
          {
            label: t('viewLive'),
            onSelect: () =>
              window.open(
                `/${language}/courses/${course.details.slug}`,
                '_blank',
                'noopener,noreferrer',
              ),
          },
        ]
      : []),
    ...(!assistant
      ? [
          {
            label: t(course.status === 'archived' ? 'unarchive' : 'archive'),
            onSelect: () =>
              course.status === 'archived' ? onUnarchive(course) : onArchive(course),
          },
          { label: t('deleteCourse'), onSelect: () => onDelete(course), destructive: true },
        ]
      : []),
  ];
  const status = (course: CourseListItem) => (
    <span className="inline-flex rounded-pill bg-canvas px-3 py-1 text-xs">
      {t(`statuses.${course.status}`)}
    </span>
  );
  const cover = (course: CourseListItem) => (
    <SmartImage
      slot="course-cover-default"
      alt={course.details.coverImage.alt[language] || titleFor(course)}
      srcOverride={course.details.coverImage.src}
      width={96}
      height={60}
      className="h-14 w-20 rounded-xs"
    />
  );
  return (
    <>
      <div className="hidden overflow-x-auto rounded-md border border-border bg-surface md:block">
        <table className="w-full min-w-[62rem] text-start text-sm">
          <thead className="bg-canvas text-muted">
            <tr>
              {[
                'course',
                'category',
                'status',
                'instructor',
                'price',
                'updated',
                'author',
                'actions',
              ].map((key) => (
                <th key={key} className="p-3 text-start">
                  {t(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((course) => (
              <tr key={course.id} className="border-t border-border">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {cover(course)}
                    <div className="min-w-0">
                      <Link
                        className="font-semibold text-primary-strong hover:underline"
                        to={`/${area}/courses/${course.id}`}
                      >
                        {titleFor(course)}
                      </Link>
                      <p className="text-xs text-muted">/{course.details.slug}</p>
                      {course.hasPendingRevision && (
                        <span className="text-xs text-info">{t('revisionPendingHint')}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">{course.details.category}</td>
                <td className="p-3">{status(course)}</td>
                <td className="p-3">{course.details.instructor.name[language] || t('notSet')}</td>
                <td className="p-3">
                  {course.details.pricing.price === null
                    ? t('contactUsPrice')
                    : new Intl.NumberFormat(language, {
                        style: 'currency',
                        currency: course.details.pricing.currency,
                      }).format(course.details.pricing.price / 100)}
                </td>
                <td className="p-3">
                  {new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(
                    new Date(course.updatedAt),
                  )}
                </td>
                <td className="p-3">{course.authorName?.[language] || t('notSet')}</td>
                <td className="p-3">
                  <DropdownMenu label={t('actions')} items={actions(course)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 md:hidden">
        {items.map((course) => (
          <li key={course.id} className="rounded-sm border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              {cover(course)}
              <div className="min-w-0 flex-1">
                <Link
                  className="font-semibold text-primary-strong"
                  to={`/${area}/courses/${course.id}`}
                >
                  {titleFor(course)}
                </Link>
                <p dir="ltr" className="truncate text-start text-xs text-muted">
                  /{course.details.slug}
                </p>
                <div className="mt-2">{status(course)}</div>
              </div>
              <DropdownMenu label={t('actions')} items={actions(course)} />
            </div>
            <p className="mt-3 text-sm text-muted">
              {course.details.category} · {course.details.instructor.name[language] || t('notSet')}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
