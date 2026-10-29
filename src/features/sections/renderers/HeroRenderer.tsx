import { useLanguage } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { CtaLinkButton } from '../CtaLinkButton';
import { SectionImage, SectionHeading } from './SectionContent';
import { LazyCourseVideo } from '../LazyCourseVideo';
import type { AnyRendererProps } from './types';
export default function HeroRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'hero') return null;
  const c = section.content;
  const copy = (
    <div className="grid content-start gap-5">
      {c.badgeImage && <SectionImage image={c.badgeImage} language={language} width={160} height={80} className="h-12 w-auto object-contain" />}
      <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} language={language} as="h1" />
      <div className="flex flex-wrap gap-3">
        {c.primaryCta && <CtaLinkButton cta={c.primaryCta} />}
        {c.secondaryCta && <CtaLinkButton cta={c.secondaryCta} variant="secondary" />}
      </div>
    </div>
  );
  const image = c.mediaType === 'video' && c.video ? <LazyCourseVideo video={c.video} poster={c.image} /> : c.image && (
    <SectionImage
      image={c.image}
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
      id={section.settings.anchorId ?? section.id}
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
