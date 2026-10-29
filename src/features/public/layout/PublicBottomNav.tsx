import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { House, BookOpen, MessageCircle, AtSign } from 'lucide-react';
import { Tooltip } from '@/components/ui/Overlay';
import { useLanguage } from '@/i18n/useLanguage';
import { usePublicSettings } from '@/services/usePublicSettings';
import { whatsappUrl } from '@/features/public/layout/whatsapp';

export function PublicBottomNav() {
  const { language } = useLanguage();
  const { t } = useTranslation('nav');
  const settings = usePublicSettings();
  const whatsappHref = whatsappUrl(settings.whatsappNumber, t('whatsappGreeting'));
  const home = `/${language}`;
  return <nav aria-label={t('mobileNavigation')} className="fixed start-0 end-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-surface/95 ps-2 pe-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-soft backdrop-blur-md lg:hidden">
    <Link to={home} className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-sm text-[10px] text-muted hover:text-primary-strong"><House aria-hidden="true" size={19} /><span>{t('home')}</span></Link>
    <Link to={`${home}/courses`} className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-sm text-[10px] text-muted hover:text-primary-strong"><BookOpen aria-hidden="true" size={19} /><span>{t('courses')}</span></Link>
    {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-sm text-[10px] text-muted hover:text-primary-strong"><MessageCircle aria-hidden="true" size={19} /><span>{t('whatsapp')}</span></a> : <Tooltip content={t('whatsappUnavailable')}><span role="note" tabIndex={0} aria-label={t('whatsappUnavailable')} className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-sm text-[10px] text-subtle"><MessageCircle aria-hidden="true" size={19} /><span>{t('whatsapp')}</span></span></Tooltip>}
    <a href={`${home}#contact`} className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-sm text-[10px] text-muted hover:text-primary-strong"><AtSign aria-hidden="true" size={19} /><span>{t('contact')}</span></a>
  </nav>;
}
