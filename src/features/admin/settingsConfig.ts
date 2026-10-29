export type SettingsSection =
  | 'academy'
  | 'contact'
  | 'social'
  | 'messaging'
  | 'registration'
  | 'payments'
  | 'categories'
  | 'seo'
  | 'permissions'
  | 'legal';

export const settingsSections: SettingsSection[] = [
  'academy',
  'contact',
  'social',
  'messaging',
  'registration',
  'payments',
  'categories',
  'seo',
  'permissions',
  'legal',
];

export const settingsSectionDefaults: Record<SettingsSection, Record<string, unknown>> = {
  academy: { name: { ar: '', en: '' }, tagline: { ar: '', en: '' }, logo: '', favicon: '' },
  contact: {
    whatsappNumber: '',
    defaultCountryCode: '+20',
    phone: '',
    email: '',
    address: { ar: '', en: '' },
    mapLink: '',
    openingHours: { ar: '', en: '' },
  },
  social: { facebook: '', instagram: '', youtube: '', tiktok: '', linkedin: '', x: '' },
  messaging: { registrationMessage: { ar: '', en: '' }, greeting: { ar: '', en: '' } },
  registration: { privacyUrl: '', confirmationNote: { ar: '', en: '' } },
  payments: {
    defaultCurrency: 'EGP',
    enabledCurrencies: ['EGP'],
    methods: { cash: true, bank_transfer: false, e_wallet: false, instapay: false, other: false },
    instructions: { ar: '', en: '' },
  },
  categories: { items: [] },
  seo: {
    titleTemplate: '',
    description: { ar: '', en: '' },
    ogImage: '',
    allowSearchEngines: true,
  },
  permissions: {
    defaultPermissions: ['viewLeads', 'updateFollowUp', 'viewPayments', 'manageNotes'],
    assistantsCanSeePaymentDetails: true,
  },
  legal: {
    privacyPolicy: { ar: [], en: [] },
    terms: { ar: [], en: [] },
    lastUpdated: '',
    policyVersion: 1,
  },
};

export function settingsObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
