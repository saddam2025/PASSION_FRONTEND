import { useLanguage } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { SectionImage, SectionHeading } from './SectionContent';
import { CtaLinkButton } from '../CtaLinkButton';
import type { AnyRendererProps } from './types';

export default function BannerRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'banner') return null;
  const c = section.content;
  const aspect = c.ratio === 'cinema' ? 'aspect-[2.4/1]' : c.ratio === 'standard' ? 'aspect-[16/9]' : 'aspect-[21/9]';
  return <SectionFrame settings={{ ...section.settings, width: 'full', spacing: 'sm' }} id={section.settings.anchorId ?? section.id} className="overflow-hidden">
    <div className={`relative overflow-hidden rounded-md ${aspect}`}>
      <SectionImage image={c.image} language={language} width={1600} height={700} className="absolute inset-0 size-full object-cover" />
      {(c.overlayTitle || c.overlayText || c.cta) && <div className="absolute inset-0 grid content-center justify-items-start gap-3 bg-gradient-to-t from-secondary/90 via-secondary/45 to-transparent p-5 text-on-secondary sm:p-10">
        <SectionHeading title={c.overlayTitle} subtitle={c.overlayText} language={language} />
        {c.cta && <CtaLinkButton cta={c.cta} />}
      </div>}
    </div>
  </SectionFrame>;
}
