import type { PropsWithChildren } from 'react';
import type { SectionSettings } from '@/schemas/sections';
import './sections.css';
const backgrounds = {
  none: 'bg-transparent text-ink',
  subtle: 'bg-canvas text-ink',
  brand: 'bg-primary/10 text-ink',
  dark: 'bg-secondary text-on-secondary',
  softGradient: 'bg-gradient-to-r from-primary/10 to-accent/10 text-ink',
} as const;
const spacing = { sm: 'py-6', md: 'py-10', lg: 'py-section', xl: 'py-24' } as const;
const widths = { contained: 'max-w-7xl', wide: 'max-w-screen-2xl', full: 'max-w-none' } as const;
export function SectionFrame({
  settings,
  id,
  children,
  className = '',
  registrationTarget = false,
}: PropsWithChildren<{ settings: SectionSettings; id: string; className?: string; registrationTarget?: boolean }>) {
  return (
    <section
      id={id}
      data-registration-form={registrationTarget ? '' : undefined}
      className={`section-container relative ps-container pe-container ${spacing[settings.spacing]} ${backgrounds[settings.background]} ${className}`}
    >
      <div
        className={`mx-auto w-full ${widths[settings.width]} ${settings.align === 'center' ? 'text-center' : 'text-start'}`}
      >
        {children}
      </div>
    </section>
  );
}
