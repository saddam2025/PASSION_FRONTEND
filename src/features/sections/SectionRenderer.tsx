import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { validateSection, type Section, type SectionType } from '@/schemas/sections';
import { ErrorState, RouteSkeleton } from '@/components/ui/feedback';
import type { SectionMode } from './types';
import type { AnyRendererProps } from './renderers/types';
import HeroRenderer from './renderers/HeroRenderer';
import { SectionHeadingContext } from './renderers/SectionHeadingContext';
import { SectionModeContext } from './SectionModeContext';

const renderers = {
  hero: HeroRenderer,
  imageText: lazy(() => import('./renderers/ImageTextRenderer')),
  text: lazy(() => import('./renderers/TextRenderer')),
  instructor: lazy(() => import('./renderers/InstructorRenderer')),
  featureCards: lazy(() => import('./renderers/FeatureCardsRenderer')),
  curriculum: lazy(() => import('./renderers/CurriculumRenderer')),
  pricingCta: lazy(() => import('./renderers/PricingCtaRenderer')),
  faq: lazy(() => import('./renderers/FaqRenderer')),
  contactWhatsApp: lazy(() => import('./renderers/ContactWhatsAppRenderer')),
  registrationForm: lazy(() => import('./renderers/RegistrationFormRenderer')),
  steps: lazy(() => import('./renderers/StepsRenderer')),
  banner: lazy(() => import('./renderers/BannerRenderer')),
} satisfies Record<SectionType, ComponentType<AnyRendererProps>>;
export type { SectionMode };
class SectionBoundary extends Component<
  PropsWithChildren<{ fallback: string }>,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render(): ReactNode {
    return this.state.failed ? (
      <div role="alert" className="grid justify-items-start gap-3 rounded-sm border border-danger/30 bg-danger/5 p-4 text-sm">
        <p>{this.props.fallback}</p>
        <button type="button" onClick={() => window.location.reload()} className="font-semibold text-primary-strong underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">جرّب تاني</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function SectionRenderer({
  section,
  mode = 'public',
  registrationTarget = false,
}: {
  section: unknown;
  mode?: SectionMode;
  registrationTarget?: boolean;
}) {
  const { t } = useTranslation('sections');
  const result = validateSection(section);
  const deferUntilNearViewport = mode === 'public' && result.success && result.data.type !== 'hero';
  const mountTarget = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  useEffect(() => {
    if (!deferUntilNearViewport) {
      setNearViewport(true);
      return;
    }
    const element = mountTarget.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: '400px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [deferUntilNearViewport]);
  if (!result.success) {
    if (mode === 'public') {
      return <ErrorState title={t('invalidSection')} description={t('publicError')} onRetry={() => window.location.reload()} />;
    }
    return (
      <div role="alert" className="rounded-sm border border-danger/30 bg-danger/5 p-4">
        <ErrorState
          title={t('invalidSection')}
          description={result.errors.map((error) => `${error.path}: ${error.message}`).join(' · ')}
        />
      </div>
    );
  }
  if (deferUntilNearViewport && !nearViewport) {
    return <div
      ref={mountTarget}
      id={registrationTarget ? 'register' : undefined}
      data-registration-form={registrationTarget ? '' : undefined}
      aria-hidden="true"
      className="min-h-64"
    />;
  }
  const parsed = result.data;
  const Renderer = renderers[parsed.type] as ComponentType<AnyRendererProps>;
  return (
    <div>
      <SectionBoundary fallback={t('publicError')}>
        <Suspense
          fallback={
            <div className="ps-container pe-container py-8">
              <RouteSkeleton />
            </div>
          }
        >
          <SectionModeContext.Provider value={mode}>
            <SectionHeadingContext.Provider value={parsed.heading}>
              <Renderer section={parsed as Section} mode={mode} registrationTarget={registrationTarget} />
            </SectionHeadingContext.Provider>
          </SectionModeContext.Provider>
        </Suspense>
      </SectionBoundary>
    </div>
  );
}
