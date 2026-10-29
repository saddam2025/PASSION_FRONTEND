import { useLanguage } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading } from './SectionContent';
import { ExpandableCard } from '../ExpandableCard';
import type { AnyRendererProps } from './types';
export default function BenefitsRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'benefits') return null;
  const c = section.content;
  const grid =
    c.layout === 'checklist'
      ? 'grid gap-3'
      : c.layout === 'cards2'
        ? 'section-columns-2'
        : 'section-columns-3';
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <SectionHeading title={c.title} language={language} />
      <div className={grid}>
        {c.items.map((item, index) => (
          <ExpandableCard key={index} image={item.image} badge={item.badge} icon={item.icon} title={item.title} text={item.text} details={item.details} detailsMode={item.detailsMode} />
        ))}
      </div>
    </SectionFrame>
  );
}
