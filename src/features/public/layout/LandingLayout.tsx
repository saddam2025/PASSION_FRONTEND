import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SmartImage } from '@/components/common/SmartImage';
import { usePublicSettings } from '@/services/usePublicSettings';
import { RouteTransition } from '@/components/common/motion';

export function LandingLayout() {
  const { t } = useTranslation('courses');
  const settings = usePublicSettings();
  const name = settings.academyName.ar;
  return <>
    <header className="sticky top-0 z-40 px-3 pt-2 md:px-6 md:pt-4">
      <div className="ms-auto me-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 rounded-2xl bg-surface/90 px-4 py-2 shadow-card ring-1 ring-slate-900/5 backdrop-blur-md md:px-6">
        <div aria-label={name} className="flex items-center gap-2">
          <SmartImage slot="logo" alt={name} width={120} height={40} srcOverride={settings.logo || undefined} className="h-10 w-32 object-contain" />
          <span className="font-semibold">{name}</span>
        </div>
        <button className="min-h-11 rounded-sm bg-primary-strong px-4 text-sm font-semibold text-on-primary" onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{t('register')}</button>
      </div>
    </header>
    <main id="main-content" className="min-h-[60vh]"><RouteTransition><Outlet /></RouteTransition></main>
  </>;
}
