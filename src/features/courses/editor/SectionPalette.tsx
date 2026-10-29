import { useTranslation } from 'react-i18next';
import { AllowedIcon } from '@/components/common/AllowedIcon';
import { SECTION_REGISTRY_META, type SectionType } from '@/schemas/sections';

const categories = {
  hero: 'opening', imageText: 'story', text: 'story', gallery: 'story', videoEmbed: 'story',
  instructor: 'trust', benefits: 'trust', featureCards: 'trust', accreditation: 'trust', testimonials: 'trust', statistics: 'trust', partners: 'trust',
  curriculum: 'learning', steps: 'learning', schedule: 'learning', registrationForm: 'learning',
  pricingCta: 'conversion', faq: 'conversion', contactWhatsApp: 'conversion', cta: 'conversion', banner: 'opening', divider: 'layout',
} satisfies Record<SectionType, string>;
const groups = ['opening', 'story', 'learning', 'trust', 'conversion', 'layout'] as const;
export function SectionPalette({ onAdd, disabled }: { onAdd: (type: SectionType) => void; disabled: boolean }) {
  const { t } = useTranslation('courses');
  return <div className="grid gap-4">{groups.map((group) => {
    const types = (Object.keys(categories) as SectionType[]).filter((type) => categories[type] === group);
    return <section key={group} className="grid gap-2"><h3 className="text-xs font-bold uppercase tracking-wide text-muted">{t(`sectionCategories.${group}`)}</h3><div className="grid gap-2">{types.map((type) => <button key={type} type="button" disabled={disabled} onClick={() => onAdd(type)} className="grid min-h-16 grid-cols-[auto_1fr] items-center gap-x-3 rounded-sm border border-border p-3 text-start hover:border-primary-strong disabled:opacity-50"><AllowedIcon name={SECTION_REGISTRY_META[type].icon} /><span><strong className="block text-sm">{t(`sectionTypes.${type}`)}</strong><span className="text-xs text-muted">{t(`sectionDescriptions.${type}`)}</span></span></button>)}</div></section>;
  })}</div>;
}
