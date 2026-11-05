import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicNavbar } from './PublicNavbar';
import { PublicBottomNav } from './PublicBottomNav';
import { Footer } from './Footer';
import { RouteTransition } from '@/components/common/motion';

export default function PublicShell() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const { t } = useTranslation('nav');
  useEffect(() => { mainRef.current?.focus({ preventScroll: true }); }, [pathname]);
  return <>
    <a href="#main-content" className="fixed start-4 top-2 z-[100] -translate-y-20 rounded-sm bg-primary-strong ps-4 pe-4 py-3 font-semibold text-on-primary shadow-card transition-transform focus:translate-y-0">{t('skipToContent')}</a>
    <PublicNavbar />
    <main id="main-content" ref={mainRef} tabIndex={-1} className="min-h-[60vh] pb-24 outline-none lg:pb-0"><RouteTransition><Outlet /></RouteTransition></main>
    <Footer />
    <PublicBottomNav />
  </>;
}
