import { Accordion } from '@/components/ui/TabsAccordion';
import { Frame } from './shared';
import { list, text, useLanguage } from './content';
import type { HomeSection } from '@/services/siteContent';
export function FaqSection({ section }: { section: HomeSection }) {
  const { language } = useLanguage();
  const items = list(section, 'items') as { question: unknown; answer: unknown }[];
  if (!items.length) return null;
  return (
    <Frame id="faq" title={text(section.content.title, language)}>
      <Accordion
        items={items.map((x, i) => ({
          value: `faq-${i}`,
          title: text(x.question, language),
          content: text(x.answer, language),
        }))}
      />
    </Frame>
  );
}
