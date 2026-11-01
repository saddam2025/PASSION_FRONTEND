import { useLanguage } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading } from './SectionContent';
import { RichTextRenderer } from '../RichTextRenderer';
import type { AnyRendererProps } from './types';
export default function TextRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'text') return null;
  const c = section.content;
  return (
    <SectionFrame settings={section.settings} id={section.id}>
      <div className={c.layout === 'twoColumns' ? 'section-text-columns' : ''}>
        <SectionHeading title={c.title} subtitle={c.subtitle} language={language} />
        <RichTextRenderer value={c.richText} />
      </div>
    </SectionFrame>
  );
}
