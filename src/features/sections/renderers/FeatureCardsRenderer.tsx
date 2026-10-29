import { useLanguage } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading } from './SectionContent';
import { ExpandableCard } from '../ExpandableCard';
import type { AnyRendererProps } from './types';
export default function FeatureCardsRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'featureCards') return null;
  const c = section.content;
  const columns = c.layout === 'bento'
    ? 'section-bento-grid'
    : c.columns === 2 || c.layout === 'grid2'
      ? 'section-columns-2'
      : c.columns === 4
        ? 'section-columns-4'
        : 'section-columns-3';
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <SectionHeading title={c.title} subtitle={c.subtitle} language={language} />
      <div className={columns}>
        {c.items.map((item, index) => <div key={index} className={c.layout === 'bento' && index === 0 ? 'row-span-2' : ''}><ExpandableCard image={item.image} badge={item.badge} icon={item.icon} title={item.title} text={item.text} details={item.details} detailsMode={item.detailsMode} ratio={item.ratio} /></div>)}
      </div>
    </SectionFrame>
  );
}
