import type { SectionType } from '@/schemas/sections';

export const EDITABLE_SECTION_TYPES = [
  'hero',
  'imageText',
  'text',
  'featureCards',
  'faq',
  'registrationForm',
  'curriculum',
  'instructor',
  'pricingCta',
  'steps',
] as const satisfies readonly SectionType[];

export function hasSectionEditor(type: SectionType): boolean {
  return (EDITABLE_SECTION_TYPES as readonly string[]).includes(type);
}
