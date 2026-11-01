import {
  PageConfigSchema,
  SectionSchema,
  SECTION_REGISTRY_META,
  type PageConfig,
  type Section,
  type SectionType,
} from '@/schemas/sections';

export type CourseTemplateId = 'full' | 'short' | 'blank';

export interface TemplateSectionDescriptor {
  type: SectionType;
  headingKey?: string;
  customContent?: (courseTitle?: { ar: string; en: string }) => Record<string, unknown>;
}

const emptyText = () => ({ ar: '', en: '' });
const rich = () => ({ ar: [], en: [] });
function arabicOnly<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => arabicOnly(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== 'en')
        .map(([key, child]) => [key, arabicOnly(child)]),
    ) as T;
  }
  return value;
}

/**
 * Full template contains only section types whose editors are complete for Slice 2.
 */
const fullTemplateSections: TemplateSectionDescriptor[] = [
  {
    type: 'hero',
    customContent: (courseTitle) => ({
      eyebrow: { ar: 'كورس تدريبي', en: 'Training Program' },
      title: courseTitle ? { ...courseTitle } : emptyText(),
      subtitle: {
        ar: 'شوف محتوى الكورس وطريقة التسجيل.',
        en: 'Explore the program details and registration process.',
      },
      layout: 'splitStart',
      primaryCta: {
        label: { ar: 'سجّل دلوقتي', en: 'Register now' },
        destination: { kind: 'action', action: 'scrollToRegister' },
      },
      secondaryCta: {
        label: { ar: 'كمّل الحجز على واتساب', en: 'Contact on WhatsApp' },
        destination: { kind: 'action', action: 'whatsapp' },
      },
    }),
  },
  {
    type: 'imageText',
    customContent: () => ({
      title: { ar: 'إيه هو الكورس ده؟', en: 'About the Program' },
      richText: rich(),
      image: { src: '/images/course-cover-default.webp', alt: emptyText(), decorative: true },
      layout: 'imageStart',
      imageRatio: 'landscape',
      verticalAlign: 'center',
    }),
  },
  {
    type: 'imageText',
    customContent: () => ({
      title: { ar: 'الكورس ده مناسب ليك لو...', en: '' },
      richText: rich(),
      image: { src: '/images/course-cover-default.webp', alt: emptyText(), decorative: true },
      layout: 'imageEnd',
      imageRatio: 'landscape',
      verticalAlign: 'center',
    }),
  },
  {
    type: 'text',
    customContent: () => ({
      title: { ar: 'تفاصيل أكتر', en: '' },
      subtitle: emptyText(),
      richText: rich(),
      layout: 'single',
    }),
  },
  {
    type: 'featureCards',
    customContent: () => ({
      title: { ar: 'ليه تختار الكورس ده؟', en: '' },
      subtitle: emptyText(),
      items: [],
      columns: 3,
    }),
  },
  { type: 'curriculum', customContent: () => ({ title: { ar: 'هتتعلم إيه؟', en: '' }, modules: [], layout: 'accordion' }) },
  { type: 'instructor', customContent: () => ({ name: emptyText(), title: emptyText(), bio: rich(), credentials: [], layout: 'photoStart' }) },
  { type: 'steps', customContent: () => SECTION_REGISTRY_META.steps.defaultContent() },
  { type: 'pricingCta', customContent: () => ({ title: { ar: 'الباقة والسعر', en: '' }, bullets: [], useCoursePrice: true, layout: 'card', includes: [], facts: [], whatsappCta: false }) },
  {
    type: 'faq',
    customContent: () => ({
      title: { ar: 'أسئلة شائعة', en: '' },
      items: [],
      layout: 'accordion',
    }),
  },
  {
    type: 'registrationForm',
    customContent: () => ({
      title: { ar: 'سجّل بياناتك', en: 'الكورس Registration Form' },
      subtitle: {
        ar: 'اكتب بياناتك وهنتواصل معاك على واتساب في أقرب وقت.',
        en: 'Fill in your details and an assistant will follow up on WhatsApp.',
      },
      successNote: {
        ar: 'وصلنا طلبك',
        en: 'Your registration request has been received!',
      },
      layout: 'card',
    }),
  },
];

/**
 * Short template starts with the currently editable hero, text, and registration form.
 */
const shortTemplateSections: TemplateSectionDescriptor[] = [
  {
    type: 'hero',
    customContent: (courseTitle) => ({
      eyebrow: { ar: 'كورس تدريبي', en: 'Training Program' },
      title: courseTitle ? { ...courseTitle } : emptyText(),
      subtitle: emptyText(),
      layout: 'splitStart',
      primaryCta: {
        label: { ar: 'سجّل دلوقتي', en: 'Register now' },
        destination: { kind: 'action', action: 'scrollToRegister' },
      },
    }),
  },
  {
    type: 'text',
    customContent: () => ({
      title: { ar: 'تفاصيل أكتر', en: 'Program التفاصيل' },
      subtitle: emptyText(),
      richText: rich(),
      layout: 'single',
    }),
  },
  {
    type: 'registrationForm',
    customContent: () => ({
      title: { ar: 'سجّل بياناتك', en: 'Registration Form' },
      subtitle: emptyText(),
      successNote: emptyText(),
      layout: 'card',
    }),
  },
];

/**
 * فارغ template: only registrationForm.
 */
const blankTemplateSections: TemplateSectionDescriptor[] = [
  {
    type: 'registrationForm',
    customContent: () => ({
      title: { ar: 'سجّل بياناتك', en: 'Registration Form' },
      subtitle: emptyText(),
      successNote: emptyText(),
      layout: 'card',
    }),
  },
];

function buildSection(
  descriptor: TemplateSectionDescriptor,
  courseTitle?: { ar: string; en: string },
): Section {
  const meta = SECTION_REGISTRY_META[descriptor.type];
  const content = arabicOnly(descriptor.customContent
    ? descriptor.customContent(courseTitle)
    : meta.defaultContent());

  return SectionSchema.parse({
    id: crypto.randomUUID(),
    type: descriptor.type,
    visible: true,
    settings: {
      background: 'none',
      spacing: 'lg',
      width: 'contained',
      align: 'start',
      dividerTop: 'none',
      dividerBottom: 'none',
      reveal: 'none',
    },
    content,
  });
}

export function createTemplatePageConfig(
  templateId: CourseTemplateId = 'full',
  courseTitle?: { ar: string; en: string },
): PageConfig {
  const descriptors =
    templateId === 'full'
      ? fullTemplateSections
      : templateId === 'short'
        ? shortTemplateSections
        : blankTemplateSections;

  return PageConfigSchema.parse({
    schemaVersion: 1,
    sections: descriptors.map((desc) => buildSection(desc, courseTitle)),
  });
}

export const courseTemplateSectionTypes: Record<CourseTemplateId, SectionType[]> = {
  full: fullTemplateSections.map((s) => s.type),
  short: shortTemplateSections.map((s) => s.type),
  blank: blankTemplateSections.map((s) => s.type),
};
