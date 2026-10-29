import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { Accordion } from '@/components/ui/TabsAccordion';
import { RichTextRenderer } from '../RichTextRenderer';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
export default function FaqRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'faq') return null;
  const c = section.content;
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <SectionHeading title={c.title} language={language} />
      {c.layout === 'accordion' ? <Accordion
        items={c.items.map((item, index) => ({
          value: `faq-${section.id}-${index}`,
          title: getBilingualText(item.question, language),
          content: <RichTextRenderer value={item.answer} />,
        }))}
      /> : <div className="section-faq-grid">{[...new Map(c.items.map((item) => [item.category ? getBilingualText(item.category, language) : '', item.category])).entries()].map(([category, label]) => {
        const grouped = c.items.filter((item) => (item.category ? getBilingualText(item.category, language) : '') === category);
        return <section key={category || 'general'} className="grid content-start gap-3">{label && <h3 className="font-bold text-primary-strong">{category}</h3>}{grouped.map((item, index) => <details key={index} className="rounded-sm border border-border bg-surface p-4"><summary className="cursor-pointer font-semibold">{getBilingualText(item.question, language)}</summary><div className="pt-3 text-sm text-muted"><RichTextRenderer value={item.answer} /></div></details>)}</section>;
      })}</div>}
    </SectionFrame>
  );
}
