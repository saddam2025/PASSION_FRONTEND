import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading, SectionImage } from './SectionContent';
import type { AnyRendererProps } from './types';
import { useCoursePage } from '../CoursePageContext';
export default function AccreditationRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  const { course } = useCoursePage();
  if (section.type !== 'accreditation') return null;
  if (!course.accreditationVerified) return null;
  const c = section.content;
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <SectionHeading title={c.title} language={language} />
      {course.accreditation && (
        <div className="mb-4 grid gap-2 rounded-sm border border-border bg-surface p-4">
          {course.accreditation.certificateType && (
            <h3 className="font-semibold">
              {getBilingualText(course.accreditation.certificateType, language)}
            </h3>
          )}
          {course.accreditation.statement && (
            <p className="text-sm">{getBilingualText(course.accreditation.statement, language)}</p>
          )}
          {course.accreditation.accreditingBody && (
            <p className="text-sm text-muted">
              {getBilingualText(course.accreditation.accreditingBody, language)}
            </p>
          )}
        </div>
      )}
      <div className="section-columns-2">
        {c.items.map((item, index) => (
          <article key={index} className="rounded-md border border-border bg-surface p-5">
            {item.logo && (
              <SectionImage
                image={item.logo}
                language={language}
                width={320}
                height={160}
                className="mb-4 h-16 w-40 object-contain"
              />
            )}
            <h3 className="font-bold">{getBilingualText(item.name, language)}</h3>
            {item.description && (
              <p className="mt-2 text-sm text-muted">
                {getBilingualText(item.description, language)}
              </p>
            )}
            {item.link && (
              <a
                className="mt-3 inline-flex min-h-11 items-center text-primary-strong underline"
                href={item.link}
                target={/^https?:/i.test(item.link) ? '_blank' : undefined}
                rel={/^https?:/i.test(item.link) ? 'noopener noreferrer' : undefined}
              >
                {t('learnMore')}
              </a>
            )}
          </article>
        ))}
      </div>
      {c.disclaimer && (
        <p className="mt-4 text-sm text-muted">{getBilingualText(c.disclaimer, language)}</p>
      )}
    </SectionFrame>
  );
}
