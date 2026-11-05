import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { assetManifest } from '@/assets/manifest';
import { SmartImage } from '@/components/common/SmartImage';

const splashStorageKey = 'passion-course-landing-splash-seen';
export function SplashScreen() {
  const reduced = useReducedMotion();
  const { t } = useTranslation('common');
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(splashStorageKey)) return;
      sessionStorage.setItem(splashStorageKey, '1');
    } catch { /* Storage can be disabled; the landing still gets its splash. */ }
    setVisible(true);
  }, []);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 3000);
    return () => window.clearTimeout(timer);
  }, [visible]);
  return <AnimatePresence>{visible && <motion.div className="fixed inset-0 z-[120] grid place-items-center bg-surface" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.35 } }} aria-hidden="true">
    <motion.div className="grid justify-items-center gap-4" initial={reduced ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <SmartImage slot="logo" alt="" width={assetManifest.logo.width} height={assetManifest.logo.height} className="h-12 w-36 object-contain" />
      <span className="font-display text-sm font-bold tracking-wide text-secondary">{t('brand')}</span>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}

