import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { ChevronDown } from 'lucide-react';
import { RichTextRenderer } from '../RichTextRenderer';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
export default function FaqRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'faq') return null;
  const c = section.content;
  const groups = c.layout === 'accordion'
    ? [{ key: 'all', label: '', items: c.items }]
    : [...new Map(c.items.map((item) => {
      const category = item.category ? getBilingualText(item.category, language) : '';
      return [category, category] as const;
    })).entries()].map(([category]) => ({
      key: category || 'general',
      label: category,
      items: c.items.filter((item) => (item.category ? getBilingualText(item.category, language) : '') === category),
    }));
  return (
    <SectionFrame settings={section.settings} id={section.id}>
      <SectionHeading title={c.title} language={language} />
      <div className="curriculum-tabs-card landing-faq-card">
        {groups.map((group) => <section key={group.key} className="landing-faq-group">
          {group.label && <h3 className="landing-faq-category">{group.label}</h3>}
          {group.items.map((item, index) => <details key={`${group.key}-${index}`} className="landing-faq-item">
            <summary><span>{getBilingualText(item.question, language)}</span><ChevronDown aria-hidden="true" size={20} /></summary>
            <div className="landing-faq-answer"><RichTextRenderer value={item.answer} /></div>
          </details>)}
        </section>)}
      </div>
    </SectionFrame>
  );
}
