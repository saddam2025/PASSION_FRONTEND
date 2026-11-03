import { useLanguage } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { CtaLinkButton } from '../CtaLinkButton';
import { SectionImage, SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
import { useCoursePage } from '../CoursePageContext';
export default function HeroRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { course } = useCoursePage();
  if (section.type !== 'hero') return null;
  const c = section.content;
  const copy = (
    <div className="grid content-start gap-5">
      <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} language={language} as="h1" />
      <div className="flex flex-wrap gap-3">
        {c.primaryCta && <CtaLinkButton cta={c.primaryCta} />}
        {c.secondaryCta && <CtaLinkButton cta={c.secondaryCta} variant="secondary" />}
      </div>
    </div>
  );
  const heroImage = c.image ?? course.coverImage;
  const image = heroImage && (
    <SectionImage
      image={heroImage}
      language={language}
      width={960}
      height={720}
      priority
      className="max-h-[34rem] w-full rounded-xl object-cover"
    />
  );
  return (
    <SectionFrame
      settings={section.settings}
      id={section.id}
      className={c.layout === 'imageBackground' ? 'relative overflow-hidden' : ''}
    >
      {c.layout === 'imageBackground' ? (
        <div className="relative grid min-h-96 content-center">
          {image && (
            <div className="absolute inset-0 -z-10 overflow-hidden">
              {image}
              <div className="absolute inset-0 bg-secondary/60" />
            </div>
          )}
          <div className="relative text-on-secondary">{copy}</div>
        </div>
      ) : c.layout === 'centered' ? (
        <div className="grid justify-items-center text-center">
          {copy}
          {image && <div className="mt-8 w-full">{image}</div>}
        </div>
      ) : (
        <div className="section-split">
          {c.layout === 'splitStart' ? (
            <>
              {image}
              {copy}
            </>
          ) : (
            <>
              {copy}
              {image}
            </>
          )}
        </div>
      )}
    </SectionFrame>
  );
}
