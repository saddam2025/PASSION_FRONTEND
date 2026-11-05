import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SmartImage } from '@/components/common/SmartImage';
import { usePublicSettings } from '@/services/usePublicSettings';

const contactLinks = [
  { label: 'email', value: 'info@coachpassacad.com', href: 'mailto:info@coachpassacad.com', Icon: Mail, direction: 'ltr' },
  { label: 'whatsapp', value: '+201094700533', href: 'https://wa.me/201094700533', Icon: MessageCircle, direction: 'ltr' },
  { label: 'phone', value: '+201068299533', href: 'tel:+201068299533', Icon: Phone, direction: 'ltr' },
] as const;

const socialLinks = [
  { name: 'x', label: 'X', href: 'https://x.com/coachpassacad' },
  { name: 'facebook', label: 'فيسبوك', href: 'https://www.facebook.com/coachpassacad' },
  { name: 'instagram', label: 'إنستجرام', href: 'https://www.instagram.com/coachpassacad' },
  { name: 'youtube', label: 'يوتيوب', href: 'https://www.youtube.com/@coachpassacad' },
  { name: 'linkedin', label: 'لينكدإن', href: 'https://www.linkedin.com/in/coachpassacad' },
] as const;

type SocialName = (typeof socialLinks)[number]['name'];

function SocialIcon({ name }: { name: SocialName }) {
  if (name === 'instagram') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="size-5"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none" /></svg>;
  if (name === 'youtube') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="size-5"><path d="M21.2 7.2a2.8 2.8 0 0 0-2-2C17.5 4.7 12 4.7 12 4.7s-5.5 0-7.2.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.3 12a29 29 0 0 0 .5 4.8 2.8 2.8 0 0 0 2 2c1.7.5 7.2.5 7.2.5s5.5 0 7.2-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-4.8 29 29 0 0 0-.5-4.8Z" /><path d="m10 15.5 5-3.5-5-3.5z" /></svg>;
  if (name === 'linkedin') return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.55V9h3.57v11.45Z" /></svg>;
  if (name === 'facebook') return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5"><path d="M13.4 21v-8h2.7l.4-3.2h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.5c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6v2.6h-3V13h3v8h3.9Z" /></svg>;
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5"><path d="M18.9 1.2h3.7l-8.1 9.2L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.5h2L6.5 3.2h-2l13.1 17.5Z" /></svg>;
}

export function Footer() {
  const { t } = useTranslation('footer');
  const settings = usePublicSettings();
  const academyName = settings.academyName.ar.trim() || 'Passion Academy';

  return (
    <footer className="border-t border-white/10 bg-[#15171d] ps-container pe-container pb-8 pt-10 text-white sm:pt-14">
      <div className="ms-auto me-auto grid w-full max-w-7xl gap-10 md:grid-cols-3">
        <div className="grid content-start gap-4">
          <SmartImage
            slot="logo"
            srcOverride={settings.logo || undefined}
            alt={academyName}
            width={180}
            height={60}
            className="h-14 w-44 object-contain"
          />
          <p className="font-display text-lg font-semibold">{academyName}</p>
        </div>

        <div className="grid content-start gap-4">
          <h2 className="text-base font-semibold text-white">{t('contact')}</h2>
          <ul className="grid gap-3">
            {contactLinks.map(({ label, value, href, Icon, direction }) => (
              <li key={label}>
                <a href={href} className="inline-flex min-h-10 items-center gap-3 text-sm text-slate-300 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" dir="rtl">
                  <Icon size={18} aria-hidden="true" className="shrink-0 text-cyan-300" />
                  <span className="sr-only">{t(label)}: </span>
                  <span dir={direction}>{value}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid content-start gap-4">
          <h2 className="text-base font-semibold text-white">{t('social')}</h2>
          <nav aria-label={t('socialNav')} className="grid justify-items-start gap-2">
            {socialLinks.map(({ name, label, href }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${t('followOn')} ${label}`} title={`${t('followOn')} ${label}`} className="inline-flex min-h-11 items-center gap-3 text-white transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <SocialIcon name={name} />
                <span>{t('followOn')} {label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>
      <div className="ms-auto me-auto mt-10 max-w-7xl border-t border-white/10 pt-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {academyName}. {t('copyright')}
      </div>
    </footer>
  );
}
