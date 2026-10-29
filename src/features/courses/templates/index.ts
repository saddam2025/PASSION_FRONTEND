import { PageConfigSchema, SectionSchema, type PageConfig, type SectionType } from '@/schemas/sections';

export type CourseTemplateId = 'full' | 'short' | 'blank';
const orders: Record<CourseTemplateId, SectionType[]> = {
  full: ['hero', 'imageText', 'imageText', 'featureCards', 'curriculum', 'instructor', 'testimonials', 'pricingCta', 'faq', 'registrationForm', 'contactWhatsApp', 'cta'],
  short: ['hero', 'text', 'pricingCta', 'registrationForm', 'contactWhatsApp'],
  blank: ['registrationForm'],
};
function page(types: SectionType[]): PageConfig {
  return PageConfigSchema.parse({
    schemaVersion: 1,
    sections: types.map((type) => SectionSchema.parse({
      id: crypto.randomUUID(), type, visible: true,
      settings: { background: 'none', spacing: 'lg', width: 'contained', align: 'start' },
      content: defaults(type),
    })),
  });
}
function defaults(type: SectionType): Record<string, unknown> {
  const text = { ar: '', en: '' };
  const rich = { ar: [], en: [] };
  switch (type) {
    case 'hero': return { eyebrow: text, title: text, subtitle: text, layout: 'splitStart' };
    case 'imageText': return { image: { src: '/images/course-cover-default.webp', alt: text, decorative: true }, title: text, richText: rich, layout: 'imageStart', imageRatio: 'landscape', verticalAlign: 'center' };
    case 'text': return { title: text, subtitle: text, richText: rich, layout: 'single' };
    case 'featureCards': return { title: text, subtitle: text, items: [], columns: 3 };
    case 'curriculum': return { title: text, modules: [], layout: 'accordion' };
    case 'instructor': return { name: text, title: text, bio: rich, credentials: [], layout: 'photoStart' };
    case 'testimonials': return { title: text, items: [], layout: 'carousel' };
    case 'pricingCta': return { title: text, note: rich, bullets: [], useCoursePrice: true, layout: 'card' };
    case 'faq': return { title: text, items: [], layout: 'accordion' };
    case 'registrationForm': return { title: text, subtitle: text, successNote: text, layout: 'card' };
    case 'contactWhatsApp': return { title: text, text: rich, show: { whatsapp: true, phone: false, email: false }, prefilledMessage: text, layout: 'card' };
    case 'cta': return { title: text, text, primaryCta: { label: text, destination: { kind: 'action', action: 'scrollToRegister' } }, layout: 'banner' };
    default: return {};
  }
}
export const courseTemplates: Record<CourseTemplateId, (id?: string) => PageConfig> = {
  full: () => page(orders.full),
  short: () => page(orders.short),
  blank: () => page(orders.blank),
};
export const courseTemplateSections: Record<CourseTemplateId, SectionType[]> = orders;
