import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SmartImage } from '@/components/common/SmartImage';
import { usePublicSettings } from '@/services/usePublicSettings';
import { useLanguage } from '@/i18n/useLanguage';
import { whatsappUrl } from '@/features/public/layout/whatsapp';
import { Frame } from './shared';
export function HeroSection({ title, intro }: { title: string; intro: string }) {
  const { language } = useLanguage();
  const { t } = useTranslation('home');
  const settings = usePublicSettings();
  const wa = whatsappUrl(settings.whatsappNumber, t('whatsappGreeting'));
  return (
    <Frame>
      <div className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        <div className="grid content-start gap-6">
          {settings.academyName.ar && (
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-strong">
              {settings.academyName.ar}
            </p>
          )}
          <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
            {title}
          </h1>
          {intro && <p className="max-w-xl text-lg text-muted">{intro}</p>}
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/${language}/courses`}
              className="inline-flex min-h-12 items-center rounded-xs bg-primary-strong ps-6 pe-6 font-semibold text-white"
            >
              {t('browseCourses')}
            </Link>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center rounded-xs border border-border ps-6 pe-6 font-semibold"
              >
                {t('contactWhatsApp')}
              </a>
            )}
          </div>
        </div>
        {settings.logo && <SmartImage slot="logo" srcOverride={settings.logo} alt={settings.academyName.ar} width={400} height={300} loading="eager" fetchPriority="high" sizes="(max-width: 768px) 90vw, 400px" className="mx-auto max-h-64 max-w-full object-contain" />}
      </div>
    </Frame>
  );
}
