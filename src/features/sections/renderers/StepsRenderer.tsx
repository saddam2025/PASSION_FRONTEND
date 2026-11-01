import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading, SectionImage } from './SectionContent';
import { CtaLinkButton } from '../CtaLinkButton';
import { AllowedIcon } from '@/components/common/AllowedIcon';
import type { AnyRendererProps } from './types';
import { formatNumber } from '@/lib/formatters';

export default function StepsRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'steps') return null;
  const c = section.content;
  return <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
    <SectionHeading title={c.title} language={language} />
    <ol className="section-steps">{c.items.map((item, index) => <li key={index} className="section-step-card">
      <span className="section-step-number">{formatNumber(index + 1, 0)}</span>
      {item.image ? <SectionImage image={item.image} language={language} width={240} height={160} className="size-16 rounded-sm object-cover" /> : <AllowedIcon name={item.icon} />}
      <div><h3 className="font-bold">{getBilingualText(item.title, language)}</h3><p className="mt-1 text-sm text-muted">{getBilingualText(item.text, language)}</p></div>
    </li>)}</ol>
    {c.cta && <div className="mt-6"><CtaLinkButton cta={c.cta} /></div>}
  </SectionFrame>;
}
