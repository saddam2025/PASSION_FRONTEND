// MOCK: remove in batch A4. Development-only sample using supported course sections.
import { createTemplatePageConfig } from '@/services/courses/templates';
import type { CoursePageDetail } from '@/services/courses.types';
import type { FormDefinition } from '@/schemas/registrationForm';

const arabic = (ar: string) => ({ ar, en: '' });
const formDefinition: FormDefinition = { fields: [] };

export const devSampleCourse: CoursePageDetail = {
  id: 'dev-sample',
  slug: 'dev-sample-course',
  title: arabic('معاينة الأقسام'),
  shortDescription: arabic('بيانات تجريبية لمعاينة صفحة الكورس.'),
  category: arabic('تجريبي'),
  instructorName: arabic(''),
  coverImage: { src: '/images/course-cover-default.webp', alt: arabic(''), decorative: true },
  price: null,
  promoPrice: null,
  currency: 'EGP',
  startDate: '',
  duration: arabic(''),
  deliveryMethod: '',
  publishedAt: '2026-10-29T00:00:00.000Z',
  featured: false,
  registrationOpen: false,
  whatsappMessageTemplate: arabic(''),
  pageConfig: createTemplatePageConfig('full', arabic('معاينة الأقسام')),
  formDefinition,
};
