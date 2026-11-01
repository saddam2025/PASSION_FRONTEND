import type { Course } from '@/schemas/course';
import { PageRenderer } from '@/features/sections/PageRenderer';
import type { CoursePageContextValue } from '@/features/sections/CoursePageContext';
import { usePublicSettings } from '@/services/usePublicSettings';
import type { SectionMode } from '@/features/sections/types';
import type { Snapshot } from '@/schemas/course';
import { hasSectionEditor } from './studio/editableSections';

export function CoursePagePreview({
  course,
  mode = 'preview',
  snapshot = course.draft,
  onSectionSelect,
  selectedSectionId,
  editableOnly = false,
}: {
  course: Course;
  mode?: SectionMode;
  snapshot?: Snapshot;
  onSectionSelect?: (id: string) => void;
  selectedSectionId?: string | null;
  editableOnly?: boolean;
}) {
  const settings = usePublicSettings();
  const d = snapshot.details;

  const context = {
    course: {
      id: course.id,
      slug: course.slug,
      title: d.title,
      shortDescription: d.shortDescription,
      price: d.pricing.price,
      promoPrice: d.pricing.promo ?? null,
      currency: d.pricing.currency,
      startDate: d.schedule.startDate ?? '',
      registrationOpen: d.enrollment.registrationOpen,
      pricingContactUs: d.pricing.contactUs === true,
      accreditationVerified: d.accreditation.verifiedByAcademy,
      instructor: d.instructor,
      delivery: d.delivery,
      schedule: d.schedule,
      accreditation: {
        statement: d.accreditation.text,
      },
      whatsappMessageTemplate: d.whatsappOverrides?.messageTemplate ?? { ar: '', en: '' },
      whatsappUrlOverride: d.whatsappOverrides?.url,
    },
    settings: {
      academyName: settings.academyName,
      whatsappNumber: settings.whatsappNumber,
      phone: settings.phone,
      email: settings.email,
      privacyUrl: settings.privacyUrl,
    },
    formDefinition: snapshot.form,
  } satisfies Omit<CoursePageContextValue, 'mode'>;

  return (
    <div className="overflow-hidden rounded-sm border border-border bg-surface">
      <PageRenderer
        config={{
          ...snapshot.page,
          sections: mode === 'builder' || editableOnly
            ? snapshot.page.sections.filter((section) => hasSectionEditor(section.type))
            : snapshot.page.sections,
        }}
        context={context}
        mode={mode}
        onSectionSelect={onSectionSelect}
        selectedSectionId={selectedSectionId}
      />
    </div>
  );
}
