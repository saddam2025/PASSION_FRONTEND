import type { CourseRecord } from '@/schemas/course';
import { PageRenderer } from '@/features/sections/PageRenderer';
import type { CoursePageContextValue } from '@/features/sections/CoursePageContext';
import { usePublicSettings } from '@/services/usePublicSettings';
import type { SectionMode } from '@/features/sections/types';

export function CoursePagePreview({ course, mode = 'preview' }: { course: CourseRecord; mode?: SectionMode }) {
  const settings = usePublicSettings();
  const context = {
    course: {
      id: course.id,
      slug: course.details.slug,
      title: course.details.title,
      shortDescription: course.details.shortDescription,
      price: course.details.pricing.price,
      promoPrice: course.details.pricing.promoPrice ?? null,
      currency: course.details.pricing.currency,
      startDate: course.details.schedule.startDate ?? '',
      registrationOpen: course.details.enrollment.registrationOpen,
      accreditationVerified: course.details.accreditation.verifiedByAcademy,
      instructor: course.details.instructor,
      delivery: course.details.delivery,
      schedule: course.details.schedule,
      accreditation: course.details.accreditation,
      whatsappMessageTemplate: course.details.contact.whatsappMessageTemplate ?? { ar: '', en: '' },
    },
    settings: {
      academyName: settings.academyName,
      whatsappNumber: settings.whatsappNumber,
      phone: settings.phone,
      email: settings.email,
    },
    formDefinition: course.details.registrationForm,
  } satisfies Omit<CoursePageContextValue, 'mode'>;
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-surface">
      <PageRenderer config={course.pageConfig} context={context} mode={mode} />
    </div>
  );
}
