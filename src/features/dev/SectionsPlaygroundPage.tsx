import { useState } from 'react';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useLanguage } from '@/i18n/useLanguage';
import { PageRenderer } from '@/features/sections/PageRenderer';
import { devSampleCourse } from '@/mocks/devSampleCourse';
export default function SectionsPlaygroundPage() {
  const [width, setWidth] = useState<320 | 768 | 1200>(1200);
  const { language } = useLanguage();
  const context = {
    course: {
      id: devSampleCourse.id,
      slug: devSampleCourse.slug,
      title: devSampleCourse.title,
      shortDescription: devSampleCourse.shortDescription,
      price: devSampleCourse.price,
      promoPrice: devSampleCourse.promoPrice,
      currency: devSampleCourse.currency,
      startDate: devSampleCourse.startDate,
      registrationOpen: devSampleCourse.registrationOpen,
      whatsappMessageTemplate: devSampleCourse.whatsappMessageTemplate,
    },
    settings: {
      academyName: { ar: 'عينة تطويرية', en: 'Development sample' },
      whatsappNumber: '',
      phone: '',
      email: '',
    },
    formDefinition: devSampleCourse.formDefinition,
  };
  return (
    <main className="min-h-screen bg-canvas pb-12">
      <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-warning">
            SAMPLE · MOCK DATA
          </p>
          <h1 className="font-display text-xl font-bold">
            {language === 'ar' ? 'معاينة الأقسام' : 'Section renderer playground'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {([320, 768, 1200] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={width === value}
              className="min-h-11 rounded-sm border border-border px-3 aria-pressed:bg-primary-strong aria-pressed:text-white"
              onClick={() => setWidth(value)}
            >
              {value}px
            </button>
          ))}
          <LanguageSwitcher />
        </div>
      </header>
      <div
        className="mx-auto mt-6 overflow-hidden rounded-md border border-border bg-surface"
        style={{ maxWidth: width, width: '100%' }}
      >
        <div className="bg-warning/10 px-4 py-2 text-sm text-warning">
          {language === 'ar'
            ? 'بيانات تجريبية فقط — لا تستخدم كبيانات فعلية.'
            : 'SAMPLE DATA ONLY — not real course information.'}
        </div>
        <PageRenderer config={devSampleCourse.pageConfig} context={context} mode="preview" />
      </div>
    </main>
  );
}
