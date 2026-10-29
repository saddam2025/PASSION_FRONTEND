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
import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enAuth from './locales/en/auth.json';
import enHome from './locales/en/home.json';
import enCourses from './locales/en/courses.json';
import enConfirmation from './locales/en/confirmation.json';
import enPrivacy from './locales/en/privacy.json';
import enFooter from './locales/en/footer.json';
import enSections from './locales/en/sections.json';
import enRegistration from './locales/en/registration.json';
import enBuilder from './locales/en/builder.json';
import enDashboard from './locales/en/dashboard.json';
import enErrors from './locales/en/errors.json';
import arReview from './locales/ar/review.json';
import enReview from './locales/en/review.json';
import arNotifications from './locales/ar/notifications.json';
import enNotifications from './locales/en/notifications.json';
import arLeads from './locales/ar/leads.json';
import enLeads from './locales/en/leads.json';
import arPayments from './locales/ar/payments.json';
import enPayments from './locales/en/payments.json';
import arUsers from './locales/ar/users.json';
import enUsers from './locales/en/users.json';
import arSettings from './locales/ar/settings.json';
import enSettings from './locales/en/settings.json';
import arAudit from './locales/ar/audit.json';
import enAudit from './locales/en/audit.json';
import arAnalytics from './locales/ar/analytics.json';
import enAnalytics from './locales/en/analytics.json';
import arTerms from './locales/ar/terms.json';
import enTerms from './locales/en/terms.json';

export const namespaces = [
  'common',
  'nav',
  'auth',
  'home',
  'courses',
  'confirmation',
  'privacy',
  'footer',
  'sections',
  'registration',
  'builder',
  'dashboard',
  'errors',
  'review',
  'notifications',
  'leads',
  'payments',
  'users',
  'settings',
  'audit',
  'analytics',
  'terms',
] as const;
export type Namespace = (typeof namespaces)[number];
export type AppLanguage = 'ar' | 'en';

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
    review: arReview,
    notifications: arNotifications,
    leads: arLeads,
    payments: arPayments,
    users: arUsers,
    settings: arSettings,
    audit: arAudit,
    analytics: arAnalytics,
    terms: arTerms,
  },
  en: {
    common: enCommon,
    nav: enNav,
    auth: enAuth,
    home: enHome,
    courses: enCourses,
    confirmation: enConfirmation,
    privacy: enPrivacy,
    footer: enFooter,
    sections: enSections,
    registration: enRegistration,
    builder: enBuilder,
    dashboard: enDashboard,
    errors: enErrors,
    review: enReview,
    notifications: enNotifications,
    leads: enLeads,
    payments: enPayments,
    users: enUsers,
    settings: enSettings,
    audit: enAudit,
    analytics: enAnalytics,
    terms: enTerms,
  },
} as const;

void i18n.use(initReactI18next).init({
  resources: i18nResources,
  lng: 'ar',
  fallbackLng: 'ar',
  supportedLngs: ['ar', 'en'],
  defaultNS: 'common',
  ns: [...namespaces],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
