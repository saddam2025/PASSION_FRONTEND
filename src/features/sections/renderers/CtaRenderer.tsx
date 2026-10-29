import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { CtaLinkButton } from '../CtaLinkButton';
import type { AnyRendererProps } from './types';
export default function CtaRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'cta') return null;
  const c = section.content;
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <div className="section-cta-layout rounded-md bg-primary/10 p-6">
        <div>
          <h2 className="text-2xl font-bold">{getBilingualText(c.title, language)}</h2>
          {c.text && <p className="mt-2 text-muted">{getBilingualText(c.text, language)}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <CtaLinkButton cta={c.primaryCta} />
          {c.secondaryCta && <CtaLinkButton cta={c.secondaryCta} variant="secondary" />}
        </div>
      </div>
    </SectionFrame>
  );
}
