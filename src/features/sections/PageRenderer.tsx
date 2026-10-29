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
}: {
  config: unknown;
  context: Omit<CoursePageContextValue, 'mode'>;
  mode?: SectionMode;
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
      mode !== 'public' ||
      (section.visible &&
        !isSectionEmpty(section, { ...context.course, settings: context.settings })),
  );
  return (
    <CoursePageProvider value={value}>
      {sections.map((section) => section.settings.reveal === 'fadeUp' ? (
        <Reveal key={section.id}><SectionRenderer section={section} mode={mode} /></Reveal>
      ) : <SectionRenderer key={section.id} section={section} mode={mode} />)}
    </CoursePageProvider>
  );
}
