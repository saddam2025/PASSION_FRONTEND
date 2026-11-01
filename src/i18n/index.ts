import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arCommon from './locales/ar/common.json';
import arNav from './locales/ar/nav.json';
import arAuth from './locales/ar/auth.json';
import arHome from './locales/ar/home.json';
import arCourses from './locales/ar/courses.json';
import arConfirmation from './locales/ar/confirmation.json';
import arPrivacy from './locales/ar/privacy.json';
import arFooter from './locales/ar/footer.json';
import arSections from './locales/ar/sections.json';
import arRegistration from './locales/ar/registration.json';
import arBuilder from './locales/ar/builder.json';
import arDashboard from './locales/ar/dashboard.json';
import arErrors from './locales/ar/errors.json';
import arNotifications from './locales/ar/notifications.json';
import arLeads from './locales/ar/leads.json';
import arPayments from './locales/ar/payments.json';
import arUsers from './locales/ar/users.json';
import arSettings from './locales/ar/settings.json';
import arAudit from './locales/ar/audit.json';
import arTerms from './locales/ar/terms.json';

export const namespaces = [
  'common', 'nav', 'auth', 'home', 'courses', 'confirmation', 'privacy', 'footer', 'sections',
  'registration', 'builder', 'dashboard', 'errors', 'notifications', 'leads', 'payments',
  'users', 'settings', 'audit', 'terms',
] as const;
export type Namespace = (typeof namespaces)[number];
export type AppLanguage = 'ar';
export const SUPPORTED_LANGUAGES = ['ar'] as const;
export const DEFAULT_LANGUAGE: AppLanguage = 'ar';

export const i18nResources = {
  ar: {
    common: arCommon,
    nav: arNav,
    auth: arAuth,
    home: arHome,
    courses: arCourses,
    confirmation: arConfirmation,
    privacy: arPrivacy,
    footer: arFooter,
    sections: arSections,
    registration: arRegistration,
    builder: arBuilder,
    dashboard: arDashboard,
    errors: arErrors,
    notifications: arNotifications,
    leads: arLeads,
    payments: arPayments,
    users: arUsers,
    settings: arSettings,
    audit: arAudit,
    terms: arTerms,
  },
} as const;

void i18n.use(initReactI18next).init({
  resources: i18nResources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  defaultNS: 'common',
  ns: [...namespaces],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;


