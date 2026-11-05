import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Reveal } from '@/components/common/motion';
import { validatePage, isSectionEmpty } from '@/schemas/sections';
import { useTranslation } from 'react-i18next';
import type { CoursePageContextValue } from './CoursePageContext';
import { CoursePageProvider } from './CoursePageContext';
import { SectionRenderer } from './SectionRenderer';
import type { SectionMode } from './types';
import { ErrorState } from '@/components/ui/feedback';
import './landing.css';

function LandingSection({ children, section, index, mode }: { children: ReactNode; section: { id: string; type: string; settings: { background: string } }; index: number; mode: SectionMode }) {
  const [visible, setVisible] = useState(mode !== 'public');
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mode !== 'public' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const node = element.current;
    if (!node || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '0px 0px -18% 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode]);
  const explicit = section.settings.background !== 'none';
  return <div ref={element} data-landing-section={section.id} data-landing-type={section.type} data-landing-index={index} data-landing-background={explicit ? section.settings.background : undefined} data-landing-tone={explicit ? undefined : index % 2 === 0 ? 'light' : 'dark'} data-reveal-ready={mode === 'public' ? 'true' : undefined} data-reveal-visible={visible ? 'true' : 'false'}>{children}</div>;
}

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
    if (mode === 'public') return <ErrorState title={t('invalidSection')} description={t('publicError')} onRetry={() => window.location.reload()} />;
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
  const registrationTargetId = sections.find((section) => section.type === 'registrationForm' && section.visible)?.id;
  return (
    <CoursePageProvider value={value}>
      <div className="course-landing">
      {sections.map((section, index) => {
        const rendered = <SectionRenderer section={section} mode={mode} registrationTarget={section.id === registrationTargetId} />;
        const selectable = onSectionSelect ? (
          <div key={section.id} className={`relative cursor-pointer outline-offset-[-3px] hover:outline hover:outline-2 hover:outline-primary ${selectedSectionId === section.id ? 'outline outline-2 outline-primary' : ''} ${mode === 'builder' && !section.visible ? 'opacity-45' : ''}`} onClick={() => onSectionSelect(section.id)} data-builder-section={section.id} data-section-visible={section.visible}>
            {rendered}
          </div>
        ) : rendered;
        return <LandingSection key={section.id} section={section} index={index} mode={mode}>{section.settings.reveal === 'fadeUp' ? <Reveal>{selectable}</Reveal> : selectable}</LandingSection>;
      })}
      </div>
    </CoursePageProvider>
  );
}
