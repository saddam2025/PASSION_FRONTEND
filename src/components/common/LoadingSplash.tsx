import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { assetManifest } from '@/assets/manifest';
import { SmartImage } from '@/components/common/SmartImage';

export function LoadingSplash() {
  const { t } = useTranslation('common');

  return (
    <main
      className="fixed inset-0 z-[120] grid place-items-center bg-canvas px-6 text-ink"
      role="status"
      aria-label={t('loading')}
      aria-busy="true"
    >
      <div className="grid w-full max-w-xs justify-items-center gap-5">
        <SmartImage
          slot="logo"
          alt=""
          width={assetManifest.logo.width}
          height={assetManifest.logo.height}
          className="h-16 w-52 object-contain"
        />
        <span className="font-display text-sm font-semibold text-muted">{t('brand')}</span>
        <LoaderCircle
          aria-hidden="true"
          className="animate-spin text-primary-strong motion-reduce:animate-none"
          size={24}
        />
        <span className="text-sm text-muted">{t('loading')}</span>
      </div>
    </main>
  );
}
