import type { z } from 'zod';
import type { PricingCtaSectionSchema } from '@/schemas/sections/pricingCta';
import type { CoursePageData } from '@/features/sections/CoursePageContext';

type PricingContent = z.infer<typeof PricingCtaSectionSchema>['content'];
export function buildPricingCtaModel(content: PricingContent, course: CoursePageData) {
  const amount = course.promoPrice ?? course.price;
  const showPrice = content.useCoursePrice && !course.pricingContactUs && amount !== null;
  const facts = [
    ...content.facts,
    ...(course.schedule?.duration?.ar ? [{ icon: 'BookOpen' as const, label: { ar: 'مدة الكورس', en: '' }, value: course.schedule.duration }] : []),
    ...(course.delivery?.method ? [{ icon: 'Users' as const, label: { ar: 'طريقة الحضور', en: '' }, value: { ar: course.delivery.method === 'online' ? 'عن بُعد' : course.delivery.method === 'in_person' ? 'حضوري' : 'حضوري وعن بُعد', en: '' } }] : []),
    ...(course.startDate ? [{ icon: 'Compass' as const, label: { ar: 'تاريخ البداية', en: '' }, value: { ar: course.startDate, en: '' } }] : []),
  ];
  return { amount, showPrice, facts, label: content.overrideLabel ?? { ar: 'تواصل لمعرفة السعر', en: '' } };
}
