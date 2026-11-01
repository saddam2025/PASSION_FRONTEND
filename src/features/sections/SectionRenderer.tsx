import {
  Component,
  Suspense,
  lazy,
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { validateSection, type Section, type SectionType } from '@/schemas/sections';
import { RouteSkeleton } from '@/components/ui/feedback';
import { ErrorState } from '@/components/ui/feedback';
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
      <div role="alert" className="rounded-sm border border-danger/30 bg-danger/5 p-4 text-sm">
        {this.props.fallback}
      </div>
    ) : (
      this.props.children
    );
  }
}
export function SectionRenderer({
  section,
  mode = 'public',
}: {
  section: unknown;
  mode?: SectionMode;
}) {
  const { t } = useTranslation('sections');
  const result = validateSection(section);
  if (!result.success) {
    if (mode === 'public') {
      if (import.meta.env.DEV) console.error('Invalid public section', result.errors);
      return null;
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
              <Renderer section={parsed as Section} mode={mode} />
            </SectionHeadingContext.Provider>
          </SectionModeContext.Provider>
        </Suspense>
      </SectionBoundary>
    </div>
  );
}
