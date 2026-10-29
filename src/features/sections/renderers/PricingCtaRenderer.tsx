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
export default function PricingCtaRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  const { course } = useCoursePage();
  if (section.type !== 'pricingCta') return null;
  const c = section.content;
  const amount = course.promoPrice ?? course.price;
  const visibleAmount = c.useCoursePrice && amount !== null;
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <article className="mx-auto grid max-w-3xl gap-5 rounded-md border border-border bg-surface section-card-padding shadow-soft">
        <SectionHeading title={c.title} language={language} />
        {c.note && <RichTextRenderer value={c.note} />}
        {c.paymentType && <p className="text-sm font-semibold text-muted">{getBilingualText(c.paymentType, language)}</p>}
        {visibleAmount ? (
          <div>
            <p className="text-sm text-muted">{t('price')}</p>
            <p className="text-3xl font-bold text-primary-strong">
              {formatPrice(amount, course.currency, language)}
              {course.promoPrice !== null && course.price !== null && (
                <del className="ms-3 text-lg font-normal text-muted">
                  {formatPrice(course.price, course.currency, language)}
                </del>
              )}
            </p>
          </div>
        ) : (
          c.overrideLabel && (
            <p className="text-xl font-semibold">{getBilingualText(c.overrideLabel, language)}</p>
          )
        )}
        {c.bullets.length > 0 && (
          <ul className="grid gap-2">
            {c.bullets.map((bullet, index) => (
              <li key={index}>• {getBilingualText(bullet.text, language)}</li>
            ))}
          </ul>
        )}
        {c.facts.length > 0 && <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{c.facts.map((fact, index) => <li key={index} className="flex items-start gap-2 rounded-sm bg-canvas p-3"><AllowedIcon name={fact.icon} /><span><strong className="block text-xs text-muted">{getBilingualText(fact.label, language)}</strong><span>{getBilingualText(fact.value, language)}</span></span></li>)}</ul>}
        {c.includes.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{c.includes.map((include, index) => <ExpandableCard key={index} icon={include.icon} title={include.text} details={include.details} detailsMode={include.detailsMode} />)}</div>}
        {c.cta && <CtaLinkButton cta={c.cta} />}
        {c.whatsappCta && <CtaLinkButton variant="secondary" cta={{ label: { ar: t('whatsapp'), en: t('whatsapp') }, destination: { kind: 'action', action: 'whatsapp' } }} />}
      </article>
    </SectionFrame>
  );
}
