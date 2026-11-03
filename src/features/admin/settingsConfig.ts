import { DEFAULT_REGISTRATION_WHATSAPP_MESSAGE } from '@/schemas/settings';

export type SettingsSection = 'academy' | 'contact' | 'social' | 'messaging' | 'registration' | 'categories' | 'seo';

export const settingsSections: SettingsSection[] = ['academy', 'contact', 'social', 'messaging', 'registration', 'categories', 'seo'];

const text = () => ({ ar: '', en: '' });
export const settingsSectionDefaults: Record<SettingsSection, Record<string, unknown>> = {
  academy: { name: text(), logo: '' },
  contact: { whatsappNumber: '', phone: '', email: '' },
  social: { facebook: '', instagram: '', youtube: '', tiktok: '', linkedin: '', x: '' },
  messaging: { registrationMessage: { ar: DEFAULT_REGISTRATION_WHATSAPP_MESSAGE, en: '' } },
  registration: { privacyUrl: '', privacyPolicy: text() },
  categories: { items: [] },
  seo: { titleTemplate: '', description: text(), ogImage: '', allowSearchEngines: true },
};

export function settingsObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
