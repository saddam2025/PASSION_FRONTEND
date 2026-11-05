import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SmartImage } from '@/components/common/SmartImage';
import { usePublicSettings } from '@/services/usePublicSettings';
import { RouteTransition } from '@/components/common/motion';
import { Footer } from '@/features/public/layout/Footer';

export function AuthLayout() {
  const { t } = useTranslation('auth');
  const { pathname } = useLocation();
  const settings = usePublicSettings();
  const academyName = settings.academyName.ar.trim();

  return <>
    <div className="min-h-dvh bg-transparent lg:grid lg:grid-cols-2">
    <a href="#auth-main" className="fixed start-4 top-2 z-[100] -translate-y-20 rounded-sm bg-primary-strong ps-4 pe-4 py-3 font-semibold text-on-primary shadow-card transition-transform focus:translate-y-0">{t('skipToContent')}</a>
    <aside className="relative hidden min-h-dvh flex-col justify-between overflow-hidden bg-secondary/85 ps-container pe-container py-12 text-on-secondary lg:flex">
      <div className="absolute start-0 end-0 top-0 bottom-0 opacity-15" aria-hidden="true"><div className="absolute -start-24 top-16 size-72 rounded-full bg-accent blur-3xl" /><div className="absolute -end-16 bottom-8 size-80 rounded-full bg-primary blur-3xl" /></div>
      <div className="relative z-10 flex items-center gap-3">
        <span className="grid shrink-0 place-items-center rounded-sm bg-white p-1.5">
          <SmartImage
            slot="logo"
            srcOverride={settings.logo || undefined}
            alt={academyName || 'شعار الأكاديمية'}
            width={160}
            height={54}
            loading="eager"
            className="h-12 w-32 object-contain"
          />
        </span>
        {academyName && <span className="font-display text-lg font-bold">{academyName}</span>}
      </div>
      <div className="relative z-10 grid gap-4"><h1 className="max-w-xl font-display text-4xl font-bold leading-tight xl:text-5xl">{t('welcomeHeadline')}</h1><p className="max-w-lg text-base text-on-secondary/75">{t('welcomeDescription')}</p></div>
      <span className="relative z-10 font-mono text-xs text-on-secondary/50">{t('secureAccess')}</span>
    </aside>
    <main id="auth-main" tabIndex={-1} className="grid min-h-dvh place-items-center ps-4 pe-4 py-20 outline-none sm:ps-8 sm:pe-8">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-card sm:p-8"><RouteTransition><Outlet /></RouteTransition></div>
    </main>
    </div>
    {!/\/login\/?$/.test(pathname) && <Footer />}
  </>;
}
