import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import { SectionFrame } from '../SectionFrame';
import { CtaLinkButton } from '../CtaLinkButton';
import { RichTextRenderer } from '../RichTextRenderer';
import { formatPrice } from '@/features/public/courses/format';
import { useCoursePage } from '../CoursePageContext';
import { SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
import { AllowedIcon } from '@/components/common/AllowedIcon';
import { ExpandableCard } from '../ExpandableCard';
import { buildPricingCtaModel } from '@/lib/pricingCtaModel';

function Price({ amount, currency, language }: { amount: number; currency: string; language: 'ar' | 'en' }) {
  const value = formatPrice(amount, currency, language);
  if (currency !== 'USD') return value;
  return <bdi dir="ltr" className="inline-block whitespace-nowrap">${value.replace(/\s*\$$/, '')}</bdi>;
}

export default function PricingCtaRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  const { course } = useCoursePage();
  if (section.type !== 'pricingCta') return null;
  const c = section.content;
  const model = buildPricingCtaModel(c, course);
  const firstCta = c.cta ?? { label: { ar: 'احجز مكانك', en: '' }, destination: { kind: 'action' as const, action: 'scrollToRegister' as const } };
  const secondCta = c.secondaryCta ?? { label: { ar: 'سجّل دلوقتي', en: '' }, destination: { kind: 'action' as const, action: 'scrollToRegister' as const } };
  return (
    <SectionFrame settings={section.settings} id={section.id}>
      <article className="landing-pricing-card mx-auto grid max-w-3xl gap-5 rounded-md border border-border bg-surface section-card-padding shadow-soft">
        <SectionHeading title={c.title} language={language} />
        {c.note && <RichTextRenderer value={c.note} />}
        {c.paymentType && <p className="text-sm font-semibold text-muted">{getBilingualText(c.paymentType, language)}</p>}
        {model.showPrice ? (
          <div>
            <p className="text-sm text-muted">{t('price')}</p>
            <p className="text-3xl font-bold text-primary-strong">
              <Price amount={model.amount ?? 0} currency={course.currency} language={language}/>
              {course.promoPrice !== null && course.price !== null && (
                <del className="ms-3 text-lg font-normal text-muted">
                  <Price amount={course.price} currency={course.currency} language={language}/>
                </del>
              )}
            </p>
          </div>
        ) : (
          (c.overrideLabel || course.pricingContactUs) && (
            <p className="text-xl font-semibold">{getBilingualText(model.label, language)}</p>
          )
        )}
        {c.bullets.length > 0 && (
          <ul className="grid gap-2">
            {c.bullets.map((bullet, index) => (
              <li key={index}>• {getBilingualText(bullet.text, language)}</li>
            ))}
          </ul>
        )}
        {model.facts.length > 0 && <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{model.facts.map((fact, index) => <li key={index} className="flex items-start gap-2 rounded-sm bg-canvas p-3"><AllowedIcon name={fact.icon} /><span><strong className="block text-xs text-muted">{getBilingualText(fact.label, language)}</strong><span>{getBilingualText(fact.value, language)}</span></span></li>)}</ul>}
        {c.includes.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{c.includes.map((include, index) => <ExpandableCard key={index} icon={include.icon} title={include.text} details={include.details} detailsMode={include.detailsMode} />)}</div>}
        <div className="flex flex-wrap gap-3"><CtaLinkButton cta={firstCta} /><CtaLinkButton variant="secondary" cta={secondCta} /></div>
        {c.whatsappCta && <CtaLinkButton variant="secondary" cta={{ label: { ar: t('whatsapp'), en: t('whatsapp') }, destination: { kind: 'action', action: 'whatsapp' } }} />}
      </article>
    </SectionFrame>
  );
}
