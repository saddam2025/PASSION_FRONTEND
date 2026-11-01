import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SmartImage } from '@/components/common/SmartImage';
import { useLanguage } from '@/i18n/useLanguage';
import { usePublicSettings } from '@/services/usePublicSettings';

export function LandingLayout() {
  const { language } = useLanguage();
  const { t } = useTranslation('courses');
  const settings = usePublicSettings();
  const name = settings.academyName.ar;
  return <>
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="ms-auto me-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 ps-container pe-container">
        <Link to={`/${language}`} aria-label={name} className="flex items-center gap-2">
          <SmartImage slot="logo" alt={name} width={120} height={40} srcOverride={settings.logo || undefined} className="h-10 w-32 object-contain" />
          <span className="font-semibold">{name}</span>
        </Link>
        <button className="min-h-11 rounded-sm bg-primary-strong px-4 text-sm font-semibold text-on-primary" onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{t('register')}</button>
      </div>
    </header>
    <main id="main-content" className="min-h-[60vh]"><Outlet /></main>
    <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted">{name}</footer>
  </>;
}
