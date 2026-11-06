import { useTranslation } from 'react-i18next';
import type { MetaPixelConsentChoice } from '@/lib/metaPixel';

export function LandingPixelConsent({
  privacyUrl,
  privacyFallback,
  onChoose,
}: {
  privacyUrl?: string;
  privacyFallback: string;
  onChoose: (choice: Exclude<MetaPixelConsentChoice, null>) => void;
}) {
  const { t } = useTranslation('registration');
  const href = privacyUrl || privacyFallback;

  return (
    <aside className="mx-auto my-6 flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 rounded-sm border border-border bg-surface/95 p-4 shadow-soft [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
      <p className="min-w-0 flex-1 text-sm text-muted">{t('metaPixelConsent')}</p>
      <a className="text-sm font-semibold text-primary-strong underline" href={href} target="_blank" rel="noopener noreferrer">
        {t('metaPixelPrivacy')}
      </a>
      <div className="flex items-center gap-2">
        <button className="min-h-10 rounded-xs bg-primary-strong px-4 text-sm font-semibold text-white" type="button" onClick={() => onChoose('accepted')}>
          {t('metaPixelAccept')}
        </button>
        <button className="min-h-10 rounded-xs border border-border px-4 text-sm font-semibold text-ink" type="button" onClick={() => onChoose('rejected')}>
          {t('metaPixelReject')}
        </button>
      </div>
    </aside>
  );
}
