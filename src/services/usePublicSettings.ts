import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appQueryClient } from '@/app/queryClient';
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
  const { data, isError, isSuccess } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: () => settingsService.getPublicSettings(),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
  useEffect(() => {
    const invalidate = () => void appQueryClient.invalidateQueries({ queryKey: ['settings', 'public'] });
    window.addEventListener('passion-settings-updated', invalidate);
    return () => window.removeEventListener('passion-settings-updated', invalidate);
  }, []);
  useEffect(() => {
    if (isSuccess && data?.favicon) {
      let icon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
      if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.append(icon);
      }
      try {
        icon.href = mediaUrl(data.favicon);
      } catch {
        icon.removeAttribute('href');
      }
    }
    if (isSuccess) onLoadState?.('loaded');
    else if (isError) onLoadState?.('error');
  }, [data, isError, isSuccess, onLoadState]);
  return data ?? emptySettings;
}
