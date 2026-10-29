// MOCK: remove in batch A4
import { PageConfigSchema } from '@/schemas/sections';
import type { CoursePageDetail, CourseSummary } from '@/services/courses.types';
import type { FormDefinition } from '@/schemas/registrationForm';
const text = (ar: string, en: string) => ({ ar, en });
const rich = (ar: string, en: string) => ({
  ar: [{ type: 'paragraph' as const, children: [{ text: ar }] }],
  en: [{ type: 'paragraph' as const, children: [{ text: en }] }],
});
const formDefinition: FormDefinition = {
  fields: [
    {
      id: 'experience',
      type: 'select',
      label: text('الخبرة السابقة', 'Previous experience'),
      required: false,
      options: [
        { value: 'beginner', label: text('مبتدئ', 'Beginner') },
        { value: 'some', label: text('بعض الخبرة', 'Some experience') },
      ],
    },
  ],
};
const pageConfig = (title: { ar: string; en: string }) =>
  PageConfigSchema.parse({
    schemaVersion: 1,
    sections: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        type: 'hero',
        visible: true,
        settings: { background: 'subtle', spacing: 'xl', width: 'contained', align: 'start' },
        content: {
          eyebrow: text('دورة تدريبية', 'Training course'),
          title,
          subtitle: text('معلومات الدورة وطريقة التسجيل.', 'Course details and how to register.'),
          primaryCta: {
            label: text('سجل الآن', 'Register now'),
            destination: { kind: 'action', action: 'scrollToRegister' },
          },
          layout: 'splitStart',
        },
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        type: 'text',
        visible: true,
        settings: { background: 'none', spacing: 'lg', width: 'contained', align: 'start' },
        content: {
          title: text('عن الدورة', 'About this course'),
          richText: rich('تفاصيل الدورة متاحة هنا.', 'Course details are available here.'),
          layout: 'single',
        },
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        type: 'registrationForm',
        visible: true,
        settings: {
          background: 'subtle',
          spacing: 'lg',
          width: 'contained',
          align: 'start',
          anchorId: 'register',
        },
        content: {
          title: text('نموذج التسجيل', 'Registration form'),
          subtitle: text('سيتواصل معك فريق الأكاديمية.', 'The academy team will contact you.'),
          layout: 'card',
        },
      },
    ],
  });
const makeCourse = (
  id: string,
  slug: string,
  title: { ar: string; en: string },
  registrationOpen: boolean,
  price: number | null = null,
): CoursePageDetail => ({
  id,
  slug,
  title,
  shortDescription: text('تعرف على تفاصيل الدورة.', 'Explore the course details.'),
  category: text('مهارات', 'Skills'),
  instructorName: text('فريق الأكاديمية', 'Academy team'),
  coverImage: { src: '/images/course-cover-default.webp', alt: title, decorative: false },
  price,
  promoPrice: null,
  currency: 'EGP',
  startDate: '',
  duration: text('حسب الجدول', 'See schedule'),
  deliveryMethod: '',
  publishedAt: '2026-10-29T00:00:00.000Z',
  featured: false,
  registrationOpen,
  whatsappMessageTemplate: text(
    'أرغب في الاستفسار عن دورة {{courseTitle}}',
    'I would like to ask about {{courseTitle}}',
  ),
  pageConfig: pageConfig(title),
  formDefinition,
});
export const mockCourseRecords = [
  makeCourse(
    'course-public-001',
    'communication-skills',
    text('مهارات التواصل', 'Communication Skills'),
    true,
  ),
  makeCourse(
    'course-public-002',
    'learning-basics',
    text('أساسيات التعلم', 'Learning Basics'),
    false,
  ),
];
export const mockArchivedCourse = { slug: 'archived-course', status: 'archived' as const };
export const mockRedirects: Record<string, string> = { 'old-course-name': 'learning-basics' };
export const mockCourses: CourseSummary[] = mockCourseRecords.map((course) => ({
  slug: course.slug,
  title: course.title,
  shortDescription: course.shortDescription,
  category: course.category,
  instructorName: course.instructorName,
  coverImage: course.coverImage,
  price: course.price,
  promoPrice: course.promoPrice,
  currency: course.currency,
  startDate: course.startDate,
  duration: course.duration,
  deliveryMethod: course.deliveryMethod,
  publishedAt: course.publishedAt,
  featured: course.featured,
}));
export function getMockCourseBySlug(slug: string) {
  return mockCourseRecords.find((course) => course.slug === slug) ?? null;
}
