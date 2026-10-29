// MOCK: remove in batch A4
import { mockPublicSettings } from '@/mocks/settings';
import type { PublicSettings, SettingsService } from '@/services/settings.types';
import { adminService } from './admin.mock';
export { mockPublicSettings };
export const mockSettingsService: SettingsService = {
  async getPublicSettings(): Promise<PublicSettings> {
    const db = await adminService.publicSettings();
    const contact = db.values.contact as Partial<PublicSettings> | undefined;
    const academy = db.values.academy as
      | {
          name?: PublicSettings['academyName'];
          tagline?: PublicSettings['description'];
          logo?: string;
          favicon?: string;
        }
      | undefined;
    const social = db.values.social as Partial<PublicSettings['socials']> | undefined;
    return {
      ...mockPublicSettings,
      ...contact,
      academyName: academy?.name ?? mockPublicSettings.academyName,
      logo: academy?.logo ?? '',
      favicon: academy?.favicon ?? '',
      description: academy?.tagline ?? mockPublicSettings.description,
      socials: { ...mockPublicSettings.socials, ...social },
    };
  },
};
