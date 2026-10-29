import { useContext, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AllowedIcon } from '@/components/common/AllowedIcon';
import { SmartImage } from '@/components/common/SmartImage';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import type { IconName, ImageRef, BilingualText } from '@/schemas/sections';
import { SectionModeContext } from './SectionModeContext';

export type ExpandableCardDetail = { icon?: IconName; title: BilingualText; text?: BilingualText };
export function ExpandableCard({ image, badge, icon, title, text, details = [], detailsMode = 'inline', ratio = 'landscape' }: {
  image?: ImageRef; badge?: BilingualText; title: BilingualText; text?: BilingualText;
  icon?: IconName;
  details?: ExpandableCardDetail[]; detailsMode?: 'inline' | 'modal'; ratio?: 'square' | 'landscape' | 'portrait';
}) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  const [open, setOpen] = useState(false);
  const mode = useContext(SectionModeContext);
  const detailBody = <div className="grid gap-3">{details.map((detail, index) => <div key={index} className="flex items-start gap-3">{detail.icon && <AllowedIcon name={detail.icon} />}<div><h4 className="font-semibold">{getBilingualText(detail.title, language)}</h4>{detail.text && <p className="text-sm text-muted">{getBilingualText(detail.text, language)}</p>}</div></div>)}</div>;
  const ratioClass = ratio === 'square' ? 'aspect-square' : ratio === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]';
  return <article className="overflow-hidden rounded-md border border-border bg-surface shadow-soft">
    {image && <div className={`relative ${ratioClass}`}><SmartImage slot="about" srcOverride={image.src} alt={image.decorative ? '' : getBilingualText(image.alt, language)} width={720} height={480} loading="lazy" className="size-full object-cover" />{badge && <span className="absolute start-3 top-3 rounded-pill bg-secondary/90 px-3 py-1 text-xs font-semibold text-on-secondary">{getBilingualText(badge, language)}</span>}</div>}
    <div className="grid gap-3 p-5">{icon && !image && <AllowedIcon name={icon} />}<h3 className="font-bold">{getBilingualText(title, language)}</h3>{text && <p className="text-sm text-muted">{getBilingualText(text, language)}</p>}
      {details.length > 0 && detailsMode === 'inline' && <>{mode === 'builder' ? <span className="justify-self-start rounded-pill border border-border px-3 py-2 text-xs">{t('previewInteractions')}</span> : <><button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="min-h-9 justify-self-start rounded-pill border border-border px-3 text-xs font-semibold text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t(open ? 'lessDetails' : 'moreDetails')}</button><div className={`grid transition-[grid-template-rows,opacity] duration-300 motion-reduce:transition-none ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}><div className="overflow-hidden">{detailBody}</div></div></>}</>}
      {details.length > 0 && detailsMode === 'modal' && mode !== 'builder' && <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button type="button" className="min-h-9 justify-self-start rounded-pill border border-border px-3 text-xs font-semibold text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t('moreDetails')}</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[80] bg-secondary/50 backdrop-blur-sm" /><Dialog.Content className="fixed start-1/2 top-1/2 z-[81] max-h-[85vh] w-[min(92vw,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md border border-border bg-surface p-6 shadow-elevated focus:outline-none"><Dialog.Title className="mb-4 text-lg font-bold">{getBilingualText(title, language)}</Dialog.Title>{detailBody}<Dialog.Close asChild><button type="button" className="mt-5 min-h-10 rounded-sm border border-border px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t('close')}</button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>}
    </div>
  </article>;
}
