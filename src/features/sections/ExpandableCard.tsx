import { useContext, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { AllowedIcon } from '@/components/common/AllowedIcon';
import { SmartImage } from '@/components/common/SmartImage';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import type { IconName, ImageRef, BilingualText } from '@/schemas/sections';
import { SectionModeContext } from './SectionModeContext';

export type ExpandableCardDetail = {
  icon?: IconName;
  title: BilingualText;
  text?: BilingualText;
};

interface ExpandableCardProps {
  image?: ImageRef;
  badge?: BilingualText;
  icon?: IconName;
  title: BilingualText;
  text?: BilingualText;
  details?: ExpandableCardDetail[];
  detailsMode?: 'inline' | 'modal';
  ratio?: 'square' | 'landscape' | 'portrait';
  index?: number;
  total?: number;
  showConnector?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.48, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
};

const detailsVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
};

export function ExpandableCard({
  image,
  badge,
  icon,
  title,
  text,
  details = [],
  detailsMode = 'inline',
  ratio = 'landscape',
  index = 0,
  total = 1,
  showConnector = false,
}: ExpandableCardProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  const [inlineOpen, setInlineOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const mode = useContext(SectionModeContext);
  const reduced = useReducedMotion();
  const interactive = mode !== 'builder';
  const ratioClass = ratio === 'square' ? 'aspect-square' : ratio === 'portrait' ? 'aspect-[3/4]' : 'aspect-[16/10]';
  const titleText = getBilingualText(title, language);

  const detailBody = (
    <div className="grid gap-4">
      {details.map((detail, detailIndex) => (
        <div key={detailIndex} className="flex items-start gap-3 rounded-xl border border-border/70 bg-canvas/70 p-4">
          {detail.icon && <AllowedIcon name={detail.icon} />}
          <div>
            <h4 className="font-semibold">{getBilingualText(detail.title, language)}</h4>
            {detail.text && <p className="mt-1 text-sm leading-relaxed text-muted">{getBilingualText(detail.text, language)}</p>}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog.Root open={zoomOpen} onOpenChange={setZoomOpen}>
      <div className="feature-card-wrapper relative">
        <motion.div
          custom={index}
          variants={reduced ? undefined : cardVariants}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={{ once: true, amount: 0.12 }}
          whileHover={reduced ? undefined : { scale: 1.025, zIndex: 20 }}
          whileTap={reduced ? undefined : { scale: 0.99 }}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          className="feature-card-motion relative"
        >
          <motion.article
            className={`feature-card group relative overflow-hidden rounded-2xl border bg-surface shadow-soft transition-[border-color,box-shadow] duration-300 ${hovered ? 'border-primary/40 shadow-card' : 'border-border/80'}`}
          >
            {interactive && (
              <Dialog.Trigger asChild>
                <button type="button" aria-label={`${t('openFeatureCard')}: ${titleText}`} className="feature-card-zoom-trigger absolute inset-0 z-10 cursor-zoom-in rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary" />
              </Dialog.Trigger>
            )}

            {image && (
              <div className={`feature-card-image relative overflow-hidden ${ratioClass}`}>
                <motion.div className="size-full" animate={hovered && !reduced ? { scale: 1.06 } : { scale: 1 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                  <SmartImage
                    slot="about"
                    srcOverride={image.src}
                    alt={image.decorative ? '' : getBilingualText(image.alt ?? { ar: '', en: '' }, language)}
                    width={720}
                    height={450}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </motion.div>
                <div aria-hidden="true" className="feature-card-image-shade pointer-events-none absolute inset-0" />
                {badge && <span className="feature-card-badge absolute end-3 top-3 z-20 rounded-full border border-white/25 bg-secondary/85 px-3 py-1 text-xs font-semibold text-white shadow-soft backdrop-blur">{getBilingualText(badge, language)}</span>}
              </div>
            )}

            <div className={`feature-card-content grid gap-3 p-4 sm:p-5 ${interactive ? 'pointer-events-none' : ''}`}>
              {icon && !image && <div className="mb-1 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary-strong"><AllowedIcon name={icon} /></div>}
              {badge && !image && <span className="feature-card-badge relative z-20 justify-self-start rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary-strong">{getBilingualText(badge, language)}</span>}
              <h3 className="relative z-20 text-lg font-bold leading-snug text-ink sm:text-xl">{titleText}</h3>
              {text && <p className="relative z-20 text-sm leading-relaxed text-muted">{getBilingualText(text, language)}</p>}

              {details.length > 0 && detailsMode === 'inline' && (
                <>
                  {mode === 'builder' ? (
                    <span className="relative z-20 justify-self-start rounded-full border border-border px-3 py-2 text-xs">{t('previewInteractions')}</span>
                  ) : (
                    <>
                      <button type="button" aria-expanded={inlineOpen} onClick={() => setInlineOpen((value) => !value)} className="relative z-20 min-h-9 justify-self-start rounded-full border border-border bg-surface px-3 text-xs font-semibold text-primary-strong transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary pointer-events-auto">
                        {t(inlineOpen ? 'lessDetails' : 'moreDetails')}
                      </button>
                      <AnimatePresence initial={false}>
                        {inlineOpen && <motion.div key="inline-details" variants={detailsVariants} initial="hidden" animate="visible" exit="exit" className="relative z-20 overflow-hidden pointer-events-auto">{detailBody}</motion.div>}
                      </AnimatePresence>
                    </>
                  )}
                </>
              )}
              {details.length > 0 && detailsMode === 'modal' && mode !== 'builder' && (
                <button type="button" onClick={() => setZoomOpen(true)} className="relative z-20 min-h-9 justify-self-start rounded-full border border-border bg-surface px-3 text-xs font-semibold text-primary-strong transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary pointer-events-auto">{t('moreDetails')}</button>
              )}
            </div>

            {interactive && (
              <motion.div
                aria-hidden="true"
                className="feature-card-scan pointer-events-none absolute inset-x-0 top-0 z-[5] h-1/3"
                initial={{ y: '-120%', opacity: 0 }}
                animate={hovered && !reduced ? { y: ['-120%', '120%', '360%'], opacity: [0, 0.85, 0] } : { y: '-120%', opacity: 0 }}
                transition={{ duration: 1.45, repeat: hovered && !reduced ? Infinity : 0, repeatDelay: 0.2, ease: 'linear' }}
              />
            )}
          </motion.article>
        </motion.div>

        {showConnector && index < total - 1 && !reduced && (
          <motion.div aria-hidden="true" className="feature-card-connector pointer-events-none absolute start-full top-1/2 z-0 hidden md:block" initial={{ opacity: 0, scaleX: 0.5 }} whileInView={{ opacity: 1, scaleX: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: index * 0.08 + 0.2, duration: 0.35, ease: 'easeOut' }}>
            <span className="feature-card-connector-line" />
            <span className="feature-card-connector-dot" />
          </motion.div>
        )}
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="feature-card-backdrop fixed inset-0 z-[80] bg-slate-950/45 backdrop-blur-md" />
        <Dialog.Content className="feature-card-dialog fixed start-1/2 top-1/2 z-[81] grid max-h-[88vh] w-[min(92vw,58rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-white/30 bg-surface p-4 text-ink shadow-elevated focus:outline-none rtl:translate-x-1/2 sm:p-7">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="grid gap-2">
              <Dialog.Title className="text-xl font-bold leading-snug sm:text-2xl">{titleText}</Dialog.Title>
              {text && <Dialog.Description className="text-sm leading-relaxed text-muted sm:text-base">{getBilingualText(text, language)}</Dialog.Description>}
            </div>
            <Dialog.Close asChild><button type="button" aria-label={t('close')} className="inline-grid size-10 shrink-0 place-items-center rounded-full border border-border bg-canvas text-muted transition hover:bg-primary/10 hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X aria-hidden="true" size={18} /></button></Dialog.Close>
          </div>
          {image && <div className="mb-5 max-h-[36vh] overflow-hidden rounded-xl bg-canvas"><SmartImage slot="about" srcOverride={image.src} alt={image.decorative ? '' : getBilingualText(image.alt ?? { ar: '', en: '' }, language)} width={1200} height={750} loading="lazy" className="max-h-[36vh] w-full object-contain" /></div>}
          {badge && <span className="mb-4 inline-flex justify-self-start rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary-strong">{getBilingualText(badge, language)}</span>}
          {details.length > 0 && detailBody}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
