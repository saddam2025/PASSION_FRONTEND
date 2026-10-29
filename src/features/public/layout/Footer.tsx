import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/i18n/useLanguage';
import { usePublicSettings } from '@/services/usePublicSettings';
import { SmartImage } from '@/components/common/SmartImage';
import { whatsappUrl } from '@/features/public/layout/whatsapp';
import { useAuth } from '@/app/AuthContext';

const socialNames = ['facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'x'] as const;
function safeExternalUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function Footer() {
  const { language } = useLanguage();
  const { t: nav } = useTranslation('nav');
  const { t } = useTranslation('footer');
  const settings = usePublicSettings();
  const { user } = useAuth();
  const name =
    settings.academyName[language].trim() ||
    settings.academyName[language === 'ar' ? 'en' : 'ar'].trim();
  const description =
    settings.description[language].trim() ||
    settings.description[language === 'ar' ? 'en' : 'ar'].trim();
  const address =
    settings.address[language].trim() || settings.address[language === 'ar' ? 'en' : 'ar'].trim();
  const whatsappHref = whatsappUrl(settings.whatsappNumber, nav('whatsappGreeting'));
  const home = `/${language}`;
  const socials = socialNames
    .map((key) => ({ key, href: safeExternalUrl(settings.socials[key]) }))
    .filter((item) => item.href);

  return (
    <footer
      id="site-footer"
      className="border-t border-border bg-surface ps-container pe-container pb-24 pt-12 lg:pb-12"
    >
      <div className="ms-auto me-auto grid w-full max-w-7xl gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="grid content-start gap-3">
          <Link
            to={home}
            className="inline-flex items-center gap-2"
            aria-label={name || nav('home')}
          >
            <SmartImage
              slot="logo"
              alt={name}
              width={120}
              height={40}
              srcOverride={settings.logo || undefined}
              className="h-10 w-36 object-contain"
            />
            {name && <span className="font-display font-bold text-ink">{name}</span>}
          </Link>
          {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
        </div>
        <div className="grid content-start gap-3">
          <h2 className="text-sm font-bold text-ink">{t('quickLinks')}</h2>
          <nav
            className="grid justify-items-start gap-2 text-sm text-muted"
            aria-label={t('quickLinks')}
          >
            <Link className="hover:text-primary-strong" to={home}>
              {nav('home')}
            </Link>
            <Link className="hover:text-primary-strong" to={`${home}/courses`}>
              {nav('courses')}
            </Link>
            <a className="hover:text-primary-strong" href={`${home}#about`}>
              {nav('about')}
            </a>
            <a className="hover:text-primary-strong" href={`${home}#faq`}>
              {nav('faq')}
            </a>
            <Link className="hover:text-primary-strong" to={`${home}/privacy`}>
              {nav('privacy')}
            </Link>
            <Link className="hover:text-primary-strong" to={`${home}/terms`}>
              {nav('terms')}
            </Link>
            {!user && (
              <Link className="hover:text-primary-strong" to={`${home}/login`}>
                {nav('login')}
              </Link>
            )}
          </nav>
        </div>
        {(settings.email || settings.phone || address || whatsappHref) && (
          <div className="grid content-start gap-3">
            <h2 className="text-sm font-bold text-ink">{t('contactDetails')}</h2>
            <div className="grid justify-items-start gap-2 text-sm text-muted">
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="hover:text-primary-strong">
                  {settings.email}
                </a>
              )}
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="hover:text-primary-strong">
                  {settings.phone}
                </a>
              )}
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-strong"
                >
                  {nav('whatsapp')}
                </a>
              )}
              {address && <p>{address}</p>}
            </div>
          </div>
        )}
        {socials.length > 0 && (
          <div className="grid content-start gap-3">
            <h2 className="text-sm font-bold text-ink">{t('socialLinks')}</h2>
            <nav className="flex flex-wrap gap-3 text-sm text-muted" aria-label={t('socialLinks')}>
              {socials.map((social) => (
                <a
                  key={social.key}
                  href={social.href ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-4 hover:text-primary-strong hover:underline"
                >
                  {t(`social.${social.key}`)}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </footer>
  );
}
