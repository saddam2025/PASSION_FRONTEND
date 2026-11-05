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
      <div className="relative isolate grid justify-items-center gap-8 overflow-hidden py-14 text-center md:py-24">
        <div className="pointer-events-none absolute start-1/2 top-1/2 -z-10 size-[min(78vw,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/10 via-accent/10 to-transparent blur-3xl" aria-hidden="true" />
        {settings.logo && <div className="grid size-28 place-items-center rounded-3xl border border-border/70 bg-surface/80 p-4 shadow-card sm:size-36"><SmartImage slot="logo" srcOverride={settings.logo} alt={settings.academyName.ar} width={400} height={300} loading="eager" fetchPriority="high" sizes="(max-width: 640px) 112px, 144px" className="max-h-full max-w-full object-contain" /></div>}
        <div className="mx-auto grid max-w-4xl justify-items-center gap-6">
          {settings.academyName.ar && <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary-strong">{settings.academyName.ar}</p>}
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-6xl">
            {title}
          </h1>
          {intro && <p className="max-w-3xl text-lg leading-relaxed text-muted sm:text-xl">{intro}</p>}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={`/${language}/courses`}
              className="inline-flex min-h-12 items-center rounded-full bg-gradient-to-r from-primary-strong to-primary-hover ps-7 pe-7 font-semibold text-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.98]"
            >
              {t('browseCourses')}
            </Link>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center rounded-full border border-border bg-surface/70 ps-7 pe-7 font-semibold text-ink transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface"
              >
                {t('contactWhatsApp')}
              </a>
            )}
          </div>
        </div>
      </div>
    </Frame>
  );
}
