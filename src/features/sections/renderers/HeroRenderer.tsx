import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock3, UserRound } from 'lucide-react';
import { SectionFrame } from '../SectionFrame';
import { CtaLinkButton } from '../CtaLinkButton';
import { SectionImage, SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
import { useCoursePage } from '../CoursePageContext';
export default function HeroRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('courses');
  const { course } = useCoursePage();
  if (section.type !== 'hero') return null;
  const c = section.content;
  const copy = (
    <div className="landing-hero-copy">
      <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} language={language} as="h1" />
      {course.shortDescription && <article className="landing-hero-brief"><p>{getBilingualText(course.shortDescription, language)}</p>{c.secondaryCta && <CtaLinkButton cta={c.secondaryCta} variant="secondary" />}</article>}
      <div className="landing-hero-actions">
        {c.primaryCta && <CtaLinkButton cta={c.primaryCta} />}
      </div>
    </div>
  );
  const heroImage = c.image ?? course.coverImage;
  const image = heroImage ? (
    <SectionImage
      image={heroImage}
      language={language}
      width={960}
      height={720}
      priority
      className="landing-hero-image"
    />
  ) : <div className="landing-hero-placeholder" aria-hidden="true" />;
  const duration = course.schedule?.duration ? getBilingualText(course.schedule.duration, language) : '';
  const startDate = course.startDate;
  const instructor = course.instructor?.name ? getBilingualText(course.instructor.name, language) : '';
  return (
    <SectionFrame
      settings={section.settings}
      id={section.id}
      className={`landing-hero-section ${c.layout === 'imageBackground' ? 'relative overflow-hidden' : ''}`}
    >
      <div className={`landing-hero-grid ${c.layout === 'centered' ? 'is-centered' : ''} ${c.layout === 'splitEnd' ? 'is-image-end' : ''} ${c.layout === 'imageBackground' ? 'is-image-background' : ''}`}>
        {copy}
        <div className="landing-hero-visual">{image}
          {(duration || startDate || instructor) && <aside className="landing-hero-facts" aria-label={[instructor && t('instructor'), duration && t('duration'), startDate && t('startDate')].filter(Boolean).join('، ')}>
            {instructor && <div className="landing-hero-fact"><UserRound size={20} aria-hidden="true" /><span><small>{t('instructor')}</small><strong>{instructor}</strong></span></div>}
            {duration && <div className="landing-hero-fact"><Clock3 size={20} aria-hidden="true" /><span><small>{t('duration')}</small><strong>{duration}</strong></span></div>}
            {startDate && <div className="landing-hero-fact"><CalendarDays size={20} aria-hidden="true" /><span><small>{t('startDate')}</small><strong><bdi dir="ltr">{startDate}</bdi></strong></span></div>}
          </aside>}
        </div>
      </div>
    </SectionFrame>
  );
}
