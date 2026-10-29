import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { CountUp } from '@/components/common/CountUp';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
export default function StatisticsRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'statistics') return null;
  const c = section.content;
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <SectionHeading title={c.title} language={language} />
      <div className="section-columns-3">
        {c.items.map((item, index) => (
          <div key={index} className="rounded-md border border-border bg-surface p-5 text-center">
            <strong className="block text-3xl text-primary-strong">
              <CountUp value={item.value} language={language} />
              {item.suffix && getBilingualText(item.suffix, language)}
            </strong>
            <span className="text-sm text-muted">{getBilingualText(item.label, language)}</span>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}
