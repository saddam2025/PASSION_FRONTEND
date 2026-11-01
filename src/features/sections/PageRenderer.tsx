import { useMemo } from 'react';
import { Reveal } from '@/components/common/motion';
import { validatePage, isSectionEmpty } from '@/schemas/sections';
import { useTranslation } from 'react-i18next';
import type { CoursePageContextValue } from './CoursePageContext';
import { CoursePageProvider } from './CoursePageContext';
import { SectionRenderer } from './SectionRenderer';
import type { SectionMode } from './types';

export function PageRenderer({
  config,
  context,
  mode = 'public',
  onSectionSelect,
  selectedSectionId,
}: {
  config: unknown;
  context: Omit<CoursePageContextValue, 'mode'>;
  mode?: SectionMode;
  onSectionSelect?: (id: string) => void;
  selectedSectionId?: string | null;
}) {
  const { t } = useTranslation('sections');
  const result = useMemo(() => validatePage(config), [config]);
  if (!result.success) {
    if (mode === 'public') {
      if (import.meta.env.DEV) console.error('Invalid page configuration', result.errors);
      return null;
    }
    return (
      <div role="alert" className="m-4 rounded-sm border border-danger/30 bg-danger/5 p-4">
        <h2 className="font-bold">{t('invalidSection')}</h2>
        <p className="mt-2 text-sm">
          {result.errors.map((error) => `${error.path}: ${error.message}`).join(' · ')}
        </p>
      </div>
    );
  }
  const value = { ...context, mode };
  const sections = result.data.sections.filter(
    (section) =>
      mode === 'builder' ||
      (section.visible &&
        !isSectionEmpty(section, { ...context.course, contactUs: context.course.pricingContactUs, settings: context.settings })),
  );
  return (
    <CoursePageProvider value={value}>
      {sections.map((section) => {
        const rendered = <SectionRenderer section={section} mode={mode} />;
        const selectable = onSectionSelect ? (
          <div key={section.id} className={`relative cursor-pointer outline-offset-[-3px] hover:outline hover:outline-2 hover:outline-primary ${selectedSectionId === section.id ? 'outline outline-2 outline-primary' : ''} ${mode === 'builder' && !section.visible ? 'opacity-45' : ''}`} onClick={() => onSectionSelect(section.id)} data-builder-section={section.id} data-section-visible={section.visible}>
            {rendered}
          </div>
        ) : rendered;
        return section.settings.reveal === 'fadeUp' ? (
          <Reveal key={section.id}>{selectable}</Reveal>
        ) : selectable;
      })}
    </CoursePageProvider>
  );
}
