import { z } from 'zod';
import { HeroSectionSchema } from './hero';
import { ImageTextSectionSchema } from './imageText';
import { TextSectionSchema } from './text';
import { GallerySectionSchema } from './gallery';
import { InstructorSectionSchema } from './instructor';
import { BenefitsSectionSchema } from './benefits';
import { FeatureCardsSectionSchema } from './featureCards';
import { CurriculumSectionSchema } from './curriculum';
import { ScheduleSectionSchema } from './schedule';
import { PricingCtaSectionSchema } from './pricingCta';
import { AccreditationSectionSchema } from './accreditation';
import { TestimonialsSectionSchema } from './testimonials';
import { StatisticsSectionSchema } from './statistics';
import { VideoEmbedSectionSchema } from './videoEmbed';
import { FaqSectionSchema } from './faq';
import { ContactWhatsAppSectionSchema } from './contactWhatsApp';
import { CtaSectionSchema } from './cta';
import { DividerSectionSchema } from './divider';
import { PartnersSectionSchema } from './partners';
import { RegistrationFormSectionSchema } from './registrationForm';
import { StepsSectionSchema, StepsContentSchema } from './steps';
import { BannerSectionSchema } from './banner';
import type { BilingualText, IconName, SectionHeadingSchema } from './common';
import { hasRichText } from './richText';
import type { BilingualRichText } from './richText';

export type { IconName, BilingualText, ImageRef, CtaLink, SectionSettings, VideoEmbed } from './common';
export type { BilingualRichText } from './richText';
export {
  SectionSettingsSchema,
  BilingualTextSchema,
  SafeUrlSchema,
  MediaKeySchema,
  IconNameSchema,
  ImageRefSchema,
  CtaLinkSchema,
  VideoEmbedSchema,
  SectionHeadingSchema,
} from './common';
export type SectionHeading = z.infer<typeof SectionHeadingSchema>;
export {
  BilingualRichTextSchema,
  RichTextSchema,
  RichTextBlockSchema,
  RichTextInlineSchema,
} from './richText';
export const SectionSchema = z.discriminatedUnion('type', [
  HeroSectionSchema,
  ImageTextSectionSchema,
  TextSectionSchema,
  GallerySectionSchema,
  InstructorSectionSchema,
  BenefitsSectionSchema,
  FeatureCardsSectionSchema,
  CurriculumSectionSchema,
  ScheduleSectionSchema,
  PricingCtaSectionSchema,
  AccreditationSectionSchema,
  TestimonialsSectionSchema,
  StatisticsSectionSchema,
  VideoEmbedSectionSchema,
  FaqSectionSchema,
  ContactWhatsAppSectionSchema,
  CtaSectionSchema,
  DividerSectionSchema,
  PartnersSectionSchema,
  RegistrationFormSectionSchema,
  StepsSectionSchema,
  BannerSectionSchema,
]);
export const PageConfigSchema = z
  .object({ schemaVersion: z.literal(1), sections: z.array(SectionSchema).max(100) })
  .strict();
export type Section =
  | z.infer<typeof HeroSectionSchema>
  | z.infer<typeof ImageTextSectionSchema>
  | z.infer<typeof TextSectionSchema>
  | z.infer<typeof GallerySectionSchema>
  | z.infer<typeof InstructorSectionSchema>
  | z.infer<typeof BenefitsSectionSchema>
  | z.infer<typeof FeatureCardsSectionSchema>
  | z.infer<typeof CurriculumSectionSchema>
  | z.infer<typeof ScheduleSectionSchema>
  | z.infer<typeof PricingCtaSectionSchema>
  | z.infer<typeof AccreditationSectionSchema>
  | z.infer<typeof TestimonialsSectionSchema>
  | z.infer<typeof StatisticsSectionSchema>
  | z.infer<typeof VideoEmbedSectionSchema>
  | z.infer<typeof FaqSectionSchema>
  | z.infer<typeof ContactWhatsAppSectionSchema>
  | z.infer<typeof CtaSectionSchema>
  | z.infer<typeof DividerSectionSchema>
  | z.infer<typeof PartnersSectionSchema>
  | z.infer<typeof RegistrationFormSectionSchema>
  | z.infer<typeof StepsSectionSchema>
  | z.infer<typeof BannerSectionSchema>;
export type SectionType = Section['type'];
export type PageConfig = { schemaVersion: 1; sections: Section[] };
export type ValidationIssue = { path: string; message: string };
export type ValidationResult<T> =
  | { success: true; data: T; errors: [] }
  | { success: false; errors: ValidationIssue[] };
export type CoursePriceContext = {
  price?: number | null;
  promoPrice?: number | null;
  contactUs?: boolean;
  instructor?: { name?: BilingualText; bio?: BilingualRichText };
  registrationOpen?: boolean;
  settings?: { whatsappNumber?: string; phone?: string; email?: string };
};
const filled = (value: BilingualText | undefined) => Boolean(value?.ar.trim());
export function isSectionEmpty(section: Section, context?: CoursePriceContext): boolean {
  switch (section.type) {
    case 'hero':
      return !filled(section.content.title);
    case 'imageText':
      return !filled(section.content.title) || (!hasRichText(section.content.richText) && section.content.checklist.length === 0);
    case 'text':
      return (
        !hasRichText(section.content.richText) &&
        !filled(section.content.title) &&
        !filled(section.content.subtitle)
      );
    case 'gallery':
      return section.content.items.length === 0;
    case 'instructor':
      return !((filled(context?.instructor?.name) && hasRichText(context?.instructor?.bio)) || (filled(section.content.name) && hasRichText(section.content.bio)));
    case 'benefits':
    case 'featureCards':
      return section.content.items.length === 0;
    case 'curriculum':
      return section.content.modules.length === 0;
    case 'schedule':
      return section.content.items.length === 0;
    case 'pricingCta':
      return (
        !filled(section.content.overrideLabel) &&
        !(section.content.useCoursePrice && (context?.contactUs || context?.promoPrice != null || context?.price != null))
      );
    case 'accreditation':
      return section.content.items.length === 0;
    case 'testimonials':
      return section.content.items.length === 0;
    case 'statistics':
      return section.content.items.length === 0;
    case 'videoEmbed':
      return !section.content.video.videoId;
    case 'faq':
      return section.content.items.length === 0;
    case 'contactWhatsApp':
      return (
        !filled(section.content.title) ||
        !(
          (section.content.show.whatsapp && context?.settings?.whatsappNumber) ||
          (section.content.show.phone && context?.settings?.phone) ||
          (section.content.show.email && context?.settings?.email)
        )
      );
    case 'cta':
      return !filled(section.content.title) || !section.content.primaryCta;
    case 'divider':
      return false;
    case 'partners':
      return section.content.logos.length === 0;
    case 'registrationForm':
      return !filled(section.content.title);
    case 'steps':
      return section.content.items.length === 0;
    case 'banner':
      return !section.content.image.src;
  }
  return false;
}
function issues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}
export function validateSection(value: unknown): ValidationResult<Section> {
  const result = SectionSchema.safeParse(value);
  return result.success
    ? { success: true, data: result.data as Section, errors: [] }
    : { success: false, errors: issues(result.error) };
}
export function validatePage(value: unknown): ValidationResult<PageConfig> {
  const result = PageConfigSchema.safeParse(value);
  return result.success
    ? { success: true, data: result.data as PageConfig, errors: [] }
    : { success: false, errors: issues(result.error) };
}
export interface SectionRegistryMeta {
  labelKey: string;
  icon: IconName;
  defaultContent: () => Record<string, unknown>;
  layoutPresets: readonly string[];
}
const emptyText = (): BilingualText => ({ ar: '', en: '' });
const rich = () => ({ ar: [], en: [] });
const simple = (layout: string) => ({ title: emptyText(), layout });
export const SECTION_REGISTRY_META = {
  hero: {
    labelKey: 'hero',
    icon: 'Award',
    defaultContent: () => ({
      eyebrow: emptyText(),
      title: emptyText(),
      subtitle: emptyText(),
      layout: 'splitStart',
    }),
    layoutPresets: ['splitStart', 'splitEnd', 'centered', 'imageBackground'],
  },
  imageText: {
    labelKey: 'imageText',
    icon: 'BookOpen',
    defaultContent: () => ({
      image: {
        src: '/images/course-cover-default.webp',
        alt: { ar: '', en: '' },
        decorative: true,
      },
      title: emptyText(),
      richText: rich(),
      layout: 'imageStart',
      imageRatio: 'landscape',
      verticalAlign: 'center',
    }),
    layoutPresets: ['imageStart', 'imageEnd', 'imageTop'],
  },
  text: {
    labelKey: 'text',
    icon: 'BookOpen',
    defaultContent: () => ({
      title: emptyText(),
      subtitle: emptyText(),
      richText: rich(),
      layout: 'single',
    }),
    layoutPresets: ['single', 'twoColumns'],
  },
  gallery: {
    labelKey: 'gallery',
    icon: 'Users',
    defaultContent: () => ({ items: [], layout: 'grid3' }),
    layoutPresets: ['grid2', 'grid3', 'grid4'],
  },
  instructor: {
    labelKey: 'instructor',
    icon: 'Users',
    defaultContent: () => ({
      name: emptyText(),
      title: emptyText(),
      bio: rich(),
      credentials: [],
      layout: 'photoStart',
    }),
    layoutPresets: ['photoStart', 'photoEnd'],
  },
  benefits: {
    labelKey: 'benefits',
    icon: 'CheckCircle2',
    defaultContent: () => simple('cards3'),
    layoutPresets: ['checklist', 'cards2', 'cards3'],
  },
  featureCards: {
    labelKey: 'featureCards',
    icon: 'Compass',
    defaultContent: () => ({ title: emptyText(), subtitle: emptyText(), items: [], columns: 3 }),
    layoutPresets: ['grid2', 'grid3', 'bento'],
  },
  curriculum: {
    labelKey: 'curriculum',
    icon: 'BookOpen',
    defaultContent: () => ({ title: emptyText(), modules: [], layout: 'accordion' }),
    layoutPresets: ['accordion', 'timeline', 'numberedCards'],
  },
  schedule: {
    labelKey: 'schedule',
    icon: 'Compass',
    defaultContent: () => simple('list'),
    layoutPresets: ['list', 'table', 'timeline'],
  },
  pricingCta: {
    labelKey: 'pricingCta',
    icon: 'Award',
    defaultContent: () => ({
      title: emptyText(),
      note: rich(),
      bullets: [],
      useCoursePrice: true,
      layout: 'card',
    }),
    layoutPresets: ['card', 'inline'],
  },
  accreditation: {
    labelKey: 'accreditation',
    icon: 'Award',
    defaultContent: () => ({
      title: emptyText(),
      items: [],
      disclaimer: emptyText(),
      layout: 'grid',
    }),
    layoutPresets: ['list', 'grid'],
  },
  testimonials: {
    labelKey: 'testimonials',
    icon: 'Users',
    defaultContent: () => ({ title: emptyText(), items: [], layout: 'carousel' }),
    layoutPresets: ['carousel', 'grid'],
  },
  statistics: {
    labelKey: 'statistics',
    icon: 'CheckCircle2',
    defaultContent: () => ({ title: emptyText(), items: [], layout: 'row' }),
    layoutPresets: ['row', 'grid'],
  },
  videoEmbed: {
    labelKey: 'videoEmbed',
    icon: 'BookOpen',
    defaultContent: () => ({
      title: emptyText(),
      video: { provider: 'youtube', videoId: '', title: emptyText() },
      caption: emptyText(),
    }),
    layoutPresets: ['poster'],
  },
  faq: {
    labelKey: 'faq',
    icon: 'CheckCircle2',
    defaultContent: () => ({ title: emptyText(), items: [], layout: 'accordion' }),
    layoutPresets: ['accordion'],
  },
  contactWhatsApp: {
    labelKey: 'contactWhatsApp',
    icon: 'Users',
    defaultContent: () => ({
      title: emptyText(),
      text: rich(),
      show: { whatsapp: true, phone: false, email: false },
      prefilledMessage: emptyText(),
      layout: 'card',
    }),
    layoutPresets: ['card', 'inline'],
  },
  cta: {
    labelKey: 'cta',
    icon: 'Compass',
    defaultContent: () => ({
      title: emptyText(),
      text: emptyText(),
      primaryCta: {
        label: emptyText(),
        destination: { kind: 'action', action: 'scrollToRegister' },
      },
      secondaryCta: undefined,
      layout: 'banner',
    }),
    layoutPresets: ['banner', 'card'],
  },
  divider: {
    labelKey: 'divider',
    icon: 'CheckCircle2',
    defaultContent: () => ({ variant: 'line', size: 'md' }),
    layoutPresets: ['line', 'space', 'dots'],
  },
  partners: {
    labelKey: 'partners',
    icon: 'Users',
    defaultContent: () => ({ title: emptyText(), logos: [], layout: 'row' }),
    layoutPresets: ['row', 'grid'],
  },
  registrationForm: {
    labelKey: 'registrationForm',
    icon: 'BookOpen',
    defaultContent: () => ({
      title: emptyText(),
      subtitle: emptyText(),
      successNote: emptyText(),
      layout: 'card',
    }),
    layoutPresets: ['card'],
  },
  steps: {
    labelKey: 'steps', icon: 'Compass',
    defaultContent: () => StepsContentSchema.parse({}),
    layoutPresets: ['horizontal', 'vertical'],
  },
  banner: {
    labelKey: 'banner', icon: 'Award',
    defaultContent: () => ({ image: { src: '/images/course-cover-default.webp', alt: emptyText(), decorative: true }, ratio: 'wide', overlayTitle: emptyText(), overlayText: emptyText() }),
    layoutPresets: ['wide', 'cinema', 'standard'],
  },
} satisfies Record<SectionType, SectionRegistryMeta>;
