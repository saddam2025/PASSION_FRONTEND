import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { CtaLinkButton } from '../CtaLinkButton';
import { RichTextRenderer } from '../RichTextRenderer';
import { SectionImage, SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
export default function ImageTextRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'imageText') return null;
  const c = section.content;
  const photo = (
    <SectionImage
      image={c.image}
      language={language}
      width={900}
      height={700}
      className={`w-full object-cover ${c.imageRatio === 'square' ? 'aspect-square' : c.imageRatio === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}
    />
  );
  const text = (
    <div>
      <SectionHeading title={c.title} language={language} />
      <RichTextRenderer value={c.richText} />
      {c.checklist.length > 0 && <ul className="mt-4 grid gap-2">{c.checklist.map((item, index) => <li key={index} className="flex items-start gap-2"><span aria-hidden="true">✓</span><span>{getBilingualText(item.text, language)}</span></li>)}</ul>}
      {c.cta && (
        <div className="mt-5">
          <CtaLinkButton cta={c.cta} />
        </div>
      )}
    </div>
  );
  return (
    <SectionFrame settings={section.settings} id={section.id}>
      {c.layout === 'imageTop' ? (
        <div className="grid gap-6">
          {photo}
          {text}
        </div>
      ) : (
        <div className="section-split">
          {c.layout === 'imageStart' ? (
            <>
              {photo}
              {text}
            </>
          ) : (
            <>
              {text}
              {photo}
            </>
          )}
        </div>
      )}
    </SectionFrame>
  );
}
