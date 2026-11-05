import { useLanguage } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading } from './SectionContent';
import { ExpandableCard } from '../ExpandableCard';
import type { AnyRendererProps } from './types';
import type { CSSProperties } from 'react';
export default function FeatureCardsRenderer({ section, mode }: AnyRendererProps) {
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
  const desktopColumns = c.layout === 'grid2' || c.columns === 2 ? 2 : c.columns === 4 ? 4 : 3;
  const mobileCarousel = mode === 'public' && c.title?.ar.trim().startsWith('ليه تختار الكورس ده؟') && c.items.length > 1;
  const gridStyle = mobileCarousel
    ? ({ '--feature-card-marquee-duration': `${Math.max(18, c.items.length * 4)}s` } as CSSProperties)
    : undefined;
  const renderItems = (clone = false) => c.items.map((item, index) => <div key={`${item.title.ar}-${index}${clone ? '-clone' : ''}`} className={`feature-card-grid-item ${c.layout === 'bento' && index === 0 ? 'row-span-2' : ''}`}><ExpandableCard image={item.image} badge={item.badge} icon={item.icon} title={item.title} text={item.text} details={item.details} detailsMode={item.detailsMode} ratio={item.ratio} index={index} total={c.items.length} showConnector={!clone && c.layout !== 'bento' && index < c.items.length - 1} /></div>);
  return (
    <SectionFrame settings={section.settings} id={section.id}>
      <SectionHeading title={c.title} subtitle={c.subtitle} language={language} />
      <div className={`feature-card-grid mx-auto w-full max-w-6xl ${columns}${mobileCarousel ? ' is-mobile-carousel' : ''}`} data-layout={c.layout} data-columns={desktopColumns} style={gridStyle}>
        {mobileCarousel ? <>
          <div className="feature-card-grid-track">
            <div className="feature-card-grid-group">{renderItems()}</div>
            <div className="feature-card-grid-group" data-clone="true" aria-hidden="true" inert>{renderItems(true)}</div>
          </div>
        </> : renderItems()}
      </div>
    </SectionFrame>
  );
}
