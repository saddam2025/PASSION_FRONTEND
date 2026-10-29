import { useEffect, useState, type PropsWithChildren } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSidebarPreference } from '@/features/dashboard/layout/useSidebarPreference';
import { Sidebar } from '@/features/dashboard/layout/Sidebar';
import { Topbar } from '@/features/dashboard/layout/Topbar';
import { MobileBottomNav } from '@/features/dashboard/layout/MobileBottomNav';
import { useLanguage } from '@/i18n/useLanguage';
import type { DashboardArea } from '@/features/dashboard/nav.config';
import { NewCourseDialogProvider } from '@/features/courses/newCourseDialog';

export function DashboardLayout({ area, children }: PropsWithChildren<{ area: DashboardArea }>) {
  const { collapsed, toggle } = useSidebarPreference();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const { t } = useTranslation('dashboard');
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'b') return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest('input, textarea, select, [contenteditable="true"]'))
      )
        return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  return (
    <NewCourseDialogProvider>
      <div className="flex h-dvh min-h-0 overflow-hidden bg-canvas text-ink">
        <div className="hidden md:flex">
          <Sidebar area={area} collapsed={collapsed} onCollapse={toggle} />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar area={area} onOpenDrawer={() => setDrawerOpen(true)} />
          <main
            id="dashboard-main"
            tabIndex={-1}
            aria-label={t('content')}
            className="dashboard-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain ps-container pe-container pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 outline-none md:pb-8 md:pt-8"
          >
            <div className="ms-auto me-auto grid w-full max-w-7xl gap-8">{children}</div>
          </main>
        </div>
        <MobileBottomNav area={area} onMore={() => setDrawerOpen(true)} />

        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed start-0 end-0 top-0 bottom-0 z-50 bg-secondary/50 backdrop-blur-sm transition-opacity duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0" />
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: reduceMotion ? 0 : language === 'ar' ? '100%' : '-100%' }}
                animate={{ x: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="fixed start-0 top-0 z-50 h-dvh max-h-dvh w-[min(19rem,88vw)] overflow-hidden bg-surface shadow-elevated focus:outline-none"
              >
                <Dialog.Title className="sr-only">{t('navigationTitle')}</Dialog.Title>
                <Sidebar
                  area={area}
                  collapsed={false}
                  drawer
                  onNavigate={() => setDrawerOpen(false)}
                />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </NewCourseDialogProvider>
  );
}
