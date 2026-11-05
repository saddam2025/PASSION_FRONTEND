import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { CtaLinkButton } from '../CtaLinkButton';
import { SectionImage, SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
import { useCoursePage } from '../CoursePageContext';

export default function HeroRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { course } = useCoursePage();
  if (section.type !== 'hero') return null;

  const content = section.content;
  const isSplitLayout = content.layout === 'splitStart' || content.layout === 'splitEnd';
  const heroImage = content.image ?? course.coverImage;
  const shortDescription = getBilingualText(course.shortDescription, language).trim();

  const copy = (
    <div className="landing-hero-copy">
      <SectionHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} language={language} as="h1" />
      {shortDescription && (
        <article className="landing-hero-brief">
          <p>{shortDescription}</p>
          {content.secondaryCta && <CtaLinkButton cta={content.secondaryCta} variant="secondary" />}
        </article>
      )}
      {content.primaryCta && (
        <div className="landing-hero-actions landing-hero-primary-action">
          <CtaLinkButton cta={content.primaryCta} />
        </div>
      )}
    </div>
  );

  const image = heroImage ? (
    <div className="landing-hero-visual">
      <div className="landing-hero-media">
        <SectionImage image={heroImage} language={language} width={960} height={720} priority className="landing-hero-image" />
      </div>
    </div>
  ) : null;

  return (
    <SectionFrame settings={section.settings} id={section.id} className={`landing-hero-section ${content.layout === 'imageBackground' ? 'relative overflow-hidden' : ''}`}>
      <div
        className={`landing-hero-grid ${content.layout === 'centered' ? 'is-centered' : ''} ${content.layout === 'splitEnd' ? 'is-image-end' : ''} ${content.layout === 'imageBackground' ? 'is-image-background' : ''} ${isSplitLayout ? 'is-reference-split' : ''}`}
        data-has-image={heroImage ? 'true' : 'false'}
      >
        {copy}
        {image}
      </div>
    </SectionFrame>
  );
}
