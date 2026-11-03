import type { BilingualText } from '@/schemas';

export interface PublicSettings {
  academyName: BilingualText;
  logo?: string;
  favicon?: string;
  whatsappNumber: string;
  email: string;
  phone: string;
  address: BilingualText;
  mapLink?: string;
  openingHours?: BilingualText;
  description: BilingualText;
  privacyUrl?: string;
  allowSearchEngines?: boolean;
  registrationWhatsappTemplate?: string;
  socials: {
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
    tiktok: string;
    x: string;
  };
}
export interface SettingsService {
  getPublicSettings(): Promise<PublicSettings>;
}
