import { apiRequest } from '@/api/client';
import type { PublicSettings, SettingsService } from './settings.types';

const defaultPublic: PublicSettings = {
  academyName: { ar: '', en: '' }, logo: '', favicon: '', whatsappNumber: '', email: '', phone: '', address: { ar: '', en: '' }, mapLink: '', openingHours: { ar: '', en: '' }, description: { ar: '', en: '' }, privacyUrl: '', allowSearchEngines: true,
  socials: { facebook: '', instagram: '', linkedin: '', youtube: '', tiktok: '', x: '' },
};
export const apiSettingsService: SettingsService = {
  async getPublicSettings() {
    const raw = await apiRequest<Record<string, unknown>>('settings/public');
    const contact = (raw.contact ?? {}) as Record<string, unknown>;
    const seo = (raw.seoDefaults ?? {}) as Record<string, unknown>;
    return {
      ...defaultPublic,
      academyName: localized(raw.academyName), logo: String(raw.logoKey ?? ''),
      whatsappNumber: String(contact.whatsappNumber ?? ''), email: String(contact.email ?? ''), phone: String(contact.phone ?? ''),
      address: localized(contact.address), openingHours: localized(contact.openingHours), mapLink: String(contact.mapLink ?? ''),
      description: localized(seo.description), allowSearchEngines: seo.allowSearchEngines !== false,
      socials: { ...defaultPublic.socials, ...asStringRecord(raw.socialLinks) },
      registrationWhatsappTemplate: String(raw.whatsappMessageTemplate ?? ''),
    };
  },
};
function localized(value: unknown) { return { ar: typeof value === 'string' ? value : '', en: '' }; }
function asStringRecord(value: unknown): Record<string, string> { return value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, String(item ?? '')])) : {}; }
export const settingsService: SettingsService = apiSettingsService;
