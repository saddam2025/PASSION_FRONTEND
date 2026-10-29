import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading, getText } from './SectionContent';
import type { AnyRendererProps } from './types';
import { useCoursePage } from '../CoursePageContext';
export default function ScheduleRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  const { course } = useCoursePage();
  if (section.type !== 'schedule') return null;
  const c = section.content;
  const rows = c.items.map((item) => ({
    title: getBilingualText(item.title, language),
    date: item.date ?? '',
    time: item.time ?? '',
    location: getText(item.location, language),
    note: getText(item.note, language),
  }));
  const courseSchedule = course.schedule;
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <SectionHeading title={c.title} language={language} />
      {(courseSchedule?.startDate ||
        courseSchedule?.duration ||
        courseSchedule?.scheduleText ||
        course.delivery?.location) && (
        <div className="grid gap-2 rounded-sm border border-border bg-surface p-4 text-sm">
          <p>
            {courseSchedule?.startDate && `${t('date')}: ${courseSchedule.startDate}`}
            {courseSchedule?.duration &&
              ` · ${getBilingualText(courseSchedule.duration, language)}`}
          </p>
          {courseSchedule?.scheduleText && (
            <p>{getBilingualText(courseSchedule.scheduleText, language)}</p>
          )}
          {course.delivery?.location && (
            <p>{getBilingualText(course.delivery.location, language)}</p>
          )}
          {course.delivery?.attendanceNotes && (
            <p>{getBilingualText(course.delivery.attendanceNotes, language)}</p>
          )}
        </div>
      )}
      {c.layout === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-start">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-start">{t('date')}</th>
                <th className="p-3 text-start">{t('time')}</th>
                <th className="p-3 text-start">{t('details')}</th>
                <th className="p-3 text-start">{t('location')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="p-3">{row.date}</td>
                  <td className="p-3">{row.time}</td>
                  <td className="p-3">
                    {row.title}
                    {row.note && <p className="text-sm text-muted">{row.note}</p>}
                  </td>
                  <td className="p-3">{row.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ol
          className={`grid gap-4 ${c.layout === 'timeline' ? 'border-s-2 border-primary ps-6' : ''}`}
        >
          {rows.map((row, index) => (
            <li key={index} className="rounded-sm border border-border bg-surface p-4">
              <h3 className="font-bold">{row.title}</h3>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
                {row.date && (
                  <span>
                    {t('date')}: {row.date}
                  </span>
                )}
                {row.time && (
                  <span>
                    {t('time')}: {row.time}
                  </span>
                )}
                {row.location && (
                  <span>
                    {t('location')}: {row.location}
                  </span>
                )}
              </div>
              {row.note && <p className="mt-2 text-sm text-muted">{row.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </SectionFrame>
  );
}
