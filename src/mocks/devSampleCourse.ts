// MOCK: remove in batch A4. Every item here is visibly labelled as a development sample.
import { PageConfigSchema, type Section } from '@/schemas/sections';
import type { CoursePageDetail } from '@/services/courses.types';
import type { FormDefinition } from '@/schemas/registrationForm';
const b = (ar: string, en: string) => ({ ar, en });
const paragraph = (ar: string, en: string) => ({
  ar: [{ type: 'paragraph' as const, children: [{ text: ar }] }],
  en: [{ type: 'paragraph' as const, children: [{ text: en }] }],
});
const sample = b('عينة توضيحية فقط', 'SAMPLE — demonstration only');
const cta = {
  label: b('استكشف نموذج التسجيل', 'Explore registration'),
  destination: { kind: 'action' as const, action: 'scrollToRegister' as const },
};
const section = (id: number, type: Section['type'], content: Record<string, unknown>): Section =>
  ({
    id: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    type,
    visible: true,
    settings: { background: 'none', spacing: 'lg', width: 'contained', align: 'start' },
    content,
  }) as Section;
const sections: Section[] = [
  section(1, 'hero', {
    title: b('عينة: عنوان الدورة', 'SAMPLE: course title'),
    subtitle: sample,
    eyebrow: sample,
    primaryCta: cta,
    layout: 'splitStart',
  }),
  section(2, 'imageText', {
    title: sample,
    image: { src: '/images/course-cover-default.webp', alt: { ar: '', en: '' }, decorative: true },
    richText: paragraph('محتوى تجريبي.', 'Sample content.'),
    layout: 'imageStart',
    imageRatio: 'landscape',
    verticalAlign: 'center',
  }),
  section(3, 'text', {
    title: sample,
    richText: paragraph('محتوى تجريبي للقسم.', 'Sample section copy.'),
    layout: 'single',
  }),
  section(4, 'gallery', {
    items: [{ image: { src: '/images/course-cover-default.webp', alt: sample } }],
    layout: 'grid3',
  }),
  section(5, 'instructor', {
    name: sample,
    bio: paragraph('بيانات تعريفية تجريبية.', 'Sample biography.'),
    credentials: [],
    layout: 'photoStart',
  }),
  section(6, 'benefits', {
    title: sample,
    items: [{ icon: 'CheckCircle2', title: sample }],
    layout: 'cards3',
  }),
  section(7, 'featureCards', {
    title: sample,
    items: [{ icon: 'BookOpen', title: sample, text: sample }],
    columns: 3,
  }),
  section(8, 'curriculum', {
    title: sample,
    modules: [{ title: sample, lessons: [{ title: sample }] }],
    layout: 'accordion',
  }),
  section(9, 'schedule', {
    title: sample,
    items: [{ title: sample, date: 'Sample date' }],
    layout: 'list',
  }),
  section(10, 'pricingCta', { title: sample, useCoursePrice: true, bullets: [], layout: 'card' }),
  section(11, 'accreditation', {
    title: sample,
    items: [{ name: sample, description: sample }],
    layout: 'grid',
  }),
  section(12, 'testimonials', {
    title: sample,
    items: [{ quote: paragraph('اقتباس تجريبي.', 'Sample quote.'), authorName: sample }],
    layout: 'carousel',
  }),
  section(13, 'statistics', {
    title: sample,
    items: [{ value: '0', label: sample }],
    layout: 'row',
  }),
  section(14, 'videoEmbed', {
    title: sample,
    video: { provider: 'youtube', videoId: '', title: sample },
  }),
  section(15, 'faq', {
    title: sample,
    items: [{ question: sample, answer: paragraph('إجابة تجريبية.', 'Sample answer.') }],
    layout: 'accordion',
  }),
  section(16, 'contactWhatsApp', {
    title: sample,
    show: { whatsapp: true, phone: false, email: false },
    layout: 'card',
  }),
  section(17, 'cta', { title: sample, primaryCta: cta, layout: 'banner' }),
  section(18, 'divider', { variant: 'line', size: 'md' }),
  section(19, 'partners', {
    title: sample,
    logos: [
      {
        image: {
          src: '/images/course-cover-default.webp',
          alt: { ar: '', en: '' },
          decorative: true,
        },
        name: sample,
      },
    ],
    layout: 'row',
  }),
  section(20, 'registrationForm', {
    title: sample,
    subtitle: b(
      'الحقول تجريبية، لا ترسل بيانات حقيقية.',
      'Fields are illustrative; do not submit real information.',
    ),
    layout: 'card',
  }),
  section(21, 'steps', { title: sample, items: [{ icon: 'Compass', title: sample, text: sample }, { icon: 'BookOpen', title: sample, text: sample }], cta }),
  section(22, 'banner', { image: { src: '/images/course-cover-default.webp', alt: { ar: '', en: '' }, decorative: true }, ratio: 'wide', overlayTitle: sample, overlayText: sample, cta }),
  section(23, 'hero', { title: sample, layout: 'centered' }),
  section(24, 'hero', { title: sample, layout: 'imageBackground', image: { src: '/images/course-cover-default.webp', alt: { ar: '', en: '' }, decorative: true } }),
  section(25, 'hero', { title: sample, layout: 'splitEnd' }),
  section(26, 'imageText', { title: sample, image: { src: '/images/course-cover-default.webp', alt: { ar: '', en: '' }, decorative: true }, richText: paragraph('محتوى تجريبي.', 'Sample content.'), checklist: [{ text: sample, icon: 'CheckCircle2' }], layout: 'imageTop' }),
  section(27, 'featureCards', { title: sample, layout: 'bento', variant: 'bonuses', items: [{ image: { src: '/images/course-cover-default.webp', alt: { ar: '', en: '' }, decorative: true }, title: sample, text: sample, details: [{ title: sample, text: sample }], detailsMode: 'inline' }] }),
  section(28, 'featureCards', { title: sample, columns: 2, layout: 'grid2', items: [{ title: sample, text: sample }, { title: sample, text: sample }] }),
  section(29, 'curriculum', { title: sample, layout: 'numberedCards', modules: [{ title: sample, summary: sample, lessons: [{ title: sample }] }] }),
  section(30, 'curriculum', { title: sample, layout: 'timeline', modules: [{ title: sample, summary: sample }] }),
  section(31, 'testimonials', { title: sample, layout: 'grid', mode: 'mixed', items: [{ quote: paragraph('اقتباس تجريبي.', 'Sample quote.'), authorName: sample }] }),
  section(32, 'pricingCta', { title: sample, layout: 'inline', paymentType: sample, includes: [{ text: sample }], facts: [{ icon: 'BookOpen', label: sample, value: sample }], whatsappCta: true }),
];
const formDefinition: FormDefinition = { fields: [] };
export const devSampleCourse: CoursePageDetail = {
  id: 'dev-sample',
  slug: 'dev-sample-all-sections',
  title: b('معاينة تجريبية للأقسام', 'Development section preview'),
  shortDescription: sample,
  category: b('تجريبي', 'Sample'),
  instructorName: sample,
  coverImage: { src: '/images/course-cover-default.webp', alt: sample, decorative: false },
  price: null,
  promoPrice: null,
  currency: 'EGP',
  startDate: '',
  duration: sample,
  deliveryMethod: '',
  publishedAt: '2026-10-29T00:00:00.000Z',
  featured: false,
  registrationOpen: false,
  whatsappMessageTemplate: sample,
  pageConfig: PageConfigSchema.parse({ schemaVersion: 1, sections }),
  formDefinition,
};
