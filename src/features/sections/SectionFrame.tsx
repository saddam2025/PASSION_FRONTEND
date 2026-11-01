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
      {settings.dividerTop !== 'none' && <DividerShape kind={settings.dividerTop} position="top" />}
      <div
        className={`mx-auto w-full ${widths[settings.width]} ${settings.align === 'center' ? 'text-center' : 'text-start'}`}
      >
        {children}
      </div>
      {settings.dividerBottom !== 'none' && <DividerShape kind={settings.dividerBottom} position="bottom" />}
    </section>
  );
}
function DividerShape({ kind, position }: { kind: 'curve' | 'wave'; position: 'top' | 'bottom' }) {
  const path = kind === 'curve' ? 'M0 0H1440V24C1080 88 360 88 0 24Z' : 'M0 18C180 70 360 70 540 18S900 -34 1080 18s180 52 360 0V0H0Z';
  return <svg aria-hidden="true" viewBox="0 0 1440 80" preserveAspectRatio="none" className={`pointer-events-none absolute inset-x-0 h-8 w-full text-border/50 ${position === 'top' ? 'top-0' : 'bottom-0 rotate-180 rtl:-scale-x-100'}`}><path d={path} fill="currentColor" /></svg>;
}
