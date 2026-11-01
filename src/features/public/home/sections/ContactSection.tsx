import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Frame } from './shared';
import { useLanguage, text } from './content';
import { usePublicSettings } from '@/services/usePublicSettings';
import { useTranslation } from 'react-i18next';
import { whatsappUrl } from '@/features/public/layout/whatsapp';
import type { HomeSection } from '@/services/siteContent';
export function ContactSection({ section }: { section: HomeSection }) {
  const { language } = useLanguage();
  const { t } = useTranslation('home');
  const s = usePublicSettings();
  const address = s.address.ar;
  const wa = whatsappUrl(s.whatsappNumber, t('whatsappGreeting'));
  const openingHours =
    s.openingHours?.ar;
  if (!s.email && !s.phone && !address && !wa && !s.mapLink && !openingHours) return null;
  return (
    <Frame id="contact" title={text(section.content.title, language) || t('contactTitle')}>
      <div className="flex flex-wrap gap-4">
        {wa && (
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-xs bg-primary-strong ps-5 pe-5 text-white"
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden="true" />
            {t('contactWhatsApp')}
          </a>
        )}
        {s.phone && (
          <a className="inline-flex min-h-11 items-center gap-2" href={`tel:${s.phone}`}>
            <Phone aria-hidden="true" />
            {s.phone}
          </a>
        )}
        {s.email && (
          <a className="inline-flex min-h-11 items-center gap-2" href={`mailto:${s.email}`}>
            <Mail aria-hidden="true" />
            {s.email}
          </a>
        )}
        {address && (
          <p className="inline-flex min-h-11 items-center gap-2">
            <MapPin aria-hidden="true" />
            {address}
          </p>
        )}
        {s.mapLink && (
          <a
            className="inline-flex min-h-11 items-center gap-2 underline"
            href={s.mapLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin aria-hidden="true" />
            {t('mapLink')}
          </a>
        )}
        {openingHours && <p className="inline-flex min-h-11 items-center">{openingHours}</p>}
      </div>
    </Frame>
  );
}
