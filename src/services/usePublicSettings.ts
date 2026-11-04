import { useEffect, useState } from 'react';
import { settingsService } from '@/services/settings.api';
import type { PublicSettings } from '@/services/settings.types';
import { mediaUrl } from '@/lib/mediaUrl';

const emptySettings: PublicSettings = {
  academyName: { ar: '', en: '' },
  logo: '',
  favicon: '',
  whatsappNumber: '',
  email: '',
  phone: '',
  address: { ar: '', en: '' },
  mapLink: '',
  openingHours: { ar: '', en: '' },
  description: { ar: '', en: '' },
  privacyUrl: '',
  allowSearchEngines: true,
  socials: { facebook: '', instagram: '', linkedin: '', youtube: '', tiktok: '', x: '' },
};

export function usePublicSettings(onLoadState?: (state: 'loaded' | 'error') => void): PublicSettings {
  const [settings, setSettings] = useState(emptySettings);
  useEffect(() => {
    const refresh = () =>
      void settingsService.getPublicSettings().then((next) => {
        setSettings(next);
        if (next.favicon) {
          let icon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
          if (!icon) {
            icon = document.createElement('link');
            icon.rel = 'icon';
            document.head.append(icon);
          }
          try {
            icon.href = mediaUrl(next.favicon);
          } catch {
            icon.removeAttribute('href');
          }
        }
        onLoadState?.('loaded');
      }).catch(() => {
        setSettings(emptySettings);
        onLoadState?.('error');
      });
    refresh();
    window.addEventListener('passion-settings-updated', refresh);
    return () => window.removeEventListener('passion-settings-updated', refresh);
  }, [onLoadState]);
  return settings;
}
