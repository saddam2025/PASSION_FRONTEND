import { useEffect, useState } from 'react';
import { mockSettingsService } from '@/services/settings.mock';
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
  socials: { facebook: '', instagram: '', linkedin: '', youtube: '', tiktok: '', x: '' },
};

export function usePublicSettings(): PublicSettings {
  const [settings, setSettings] = useState(emptySettings);
  useEffect(() => {
    const refresh = () =>
      void mockSettingsService.getPublicSettings().then((next) => {
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
      });
    refresh();
    window.addEventListener('passion-settings-updated', refresh);
    return () => window.removeEventListener('passion-settings-updated', refresh);
  }, []);
  return settings;
}
