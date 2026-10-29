import type { UserPermission, UserRole } from '@/services/auth.types';
import { hasPermission } from '@/schemas/permissions';

export type DashboardArea = UserRole;
export type DashboardSection = 'overview' | 'workspace' | 'operations' | 'system';
export type DashboardIcon =
  | 'overview'
  | 'chart'
  | 'courses'
  | 'review'
  | 'leads'
  | 'payments'
  | 'users'
  | 'bell'
  | 'audit'
  | 'settings';
export interface DashboardNavItem {
  id: string;
  labelKey: string;
  descriptionKey: string;
  path: string;
  batch: string;
  icon: DashboardIcon;
  section: DashboardSection;
  roles: DashboardArea[];
  permission?: UserPermission;
  countKey?: 'pendingReviews' | 'unreadNotifications';
}

export const dashboardNav: DashboardNavItem[] = [
  {
    id: 'overview',
    labelKey: 'nav.overview',
    descriptionKey: 'descriptions.overview',
    path: '/admin',
    batch: 'F8',
    icon: 'overview',
    section: 'overview',
    roles: ['admin'],
  },
  {
    id: 'analytics',
    labelKey: 'nav.analytics',
    descriptionKey: 'descriptions.analytics',
    path: '/admin/analytics',
    batch: 'F8',
    icon: 'chart',
    section: 'overview',
    roles: ['admin'],
  },
  {
    id: 'courses',
    labelKey: 'nav.courses',
    descriptionKey: 'descriptions.courses',
    path: '/admin/courses',
    batch: 'F6',
    icon: 'courses',
    section: 'workspace',
    roles: ['admin'],
  },
  {
    id: 'reviews',
    labelKey: 'nav.reviews',
    descriptionKey: 'descriptions.reviews',
    path: '/admin/review',
    batch: 'F6',
    icon: 'review',
    section: 'workspace',
    roles: ['admin'],
    countKey: 'pendingReviews',
  },
  {
    id: 'leads',
    labelKey: 'nav.leads',
    descriptionKey: 'descriptions.leads',
    path: '/admin/leads',
    batch: 'F7',
    icon: 'leads',
    section: 'operations',
    roles: ['admin'],
  },
  {
    id: 'payments',
    labelKey: 'nav.payments',
    descriptionKey: 'descriptions.payments',
    path: '/admin/payments',
    batch: 'F7',
    icon: 'payments',
    section: 'operations',
    roles: ['admin'],
  },
  {
    id: 'users',
    labelKey: 'nav.users',
    descriptionKey: 'descriptions.users',
    path: '/admin/users',
    batch: 'F7',
    icon: 'users',
    section: 'system',
    roles: ['admin'],
  },
  {
    id: 'adminNotifications',
    labelKey: 'nav.notifications',
    descriptionKey: 'descriptions.notifications',
    path: '/admin/notifications',
    batch: 'F6',
    icon: 'bell',
    section: 'system',
    roles: ['admin'],
    countKey: 'unreadNotifications',
  },
  {
    id: 'audit',
    labelKey: 'nav.audit',
    descriptionKey: 'descriptions.audit',
    path: '/admin/audit',
    batch: 'F7',
    icon: 'audit',
    section: 'system',
    roles: ['admin'],
  },
  {
    id: 'settings',
    labelKey: 'nav.settings',
    descriptionKey: 'descriptions.settings',
    path: '/admin/settings',
    batch: 'F7',
    icon: 'settings',
    section: 'system',
    roles: ['admin'],
  },
  {
    id: 'assistantCourses',
    labelKey: 'nav.courses',
    descriptionKey: 'descriptions.courses',
    path: '/assistant/courses',
    batch: 'F6',
    icon: 'courses',
    section: 'workspace',
    roles: ['assistant'],
  },
  {
    id: 'submissions',
    labelKey: 'nav.submissions',
    descriptionKey: 'descriptions.submissions',
    path: '/assistant/submissions',
    batch: 'F6',
    icon: 'review',
    section: 'workspace',
    roles: ['assistant'],
  },
  {
    id: 'assistantLeads',
    labelKey: 'nav.leads',
    descriptionKey: 'descriptions.leads',
    path: '/assistant/leads',
    batch: 'F7',
    icon: 'leads',
    section: 'operations',
    roles: ['assistant'],
  },
  {
    id: 'assistantNotifications',
    labelKey: 'nav.notifications',
    descriptionKey: 'descriptions.notifications',
    path: '/assistant/notifications',
    batch: 'F6',
    icon: 'bell',
    section: 'system',
    roles: ['assistant'],
    countKey: 'unreadNotifications',
  },
  {
    id: 'assistantPayments',
    labelKey: 'nav.payments',
    descriptionKey: 'descriptions.payments',
    path: '/assistant/payments',
    batch: 'F7',
    icon: 'payments',
    section: 'operations',
    roles: ['assistant'],
    permission: 'viewPayments',
  },
  {
    id: 'assistantAnalytics',
    labelKey: 'nav.analytics',
    descriptionKey: 'descriptions.analytics',
    path: '/assistant/analytics',
    batch: 'F8',
    icon: 'chart',
    section: 'overview',
    roles: ['assistant'],
    permission: 'viewFinancialReports',
  },
];

export function visibleDashboardItems(
  area: DashboardArea,
  permissions: UserPermission[],
): DashboardNavItem[] {
  return dashboardNav.filter(
    (item) =>
      item.roles.includes(area) &&
      (!item.permission || hasPermission({ id: 'nav', role: area, permissions }, item.permission)),
  );
}
