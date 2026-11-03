import type { UserRole } from '@/services/auth.types';

export type DashboardArea = UserRole;
export type DashboardSection = 'overview' | 'workspace' | 'operations' | 'system';
export type DashboardIcon = 'overview' | 'courses' | 'registrations' | 'users' | 'settings';
export interface DashboardNavItem {
  id: string;
  labelKey: string;
  descriptionKey: string;
  path: string;
  icon: DashboardIcon;
  section: DashboardSection;
  roles: DashboardArea[];
}

export const dashboardNav: DashboardNavItem[] = [
  { id: 'overview', labelKey: 'nav.overview', descriptionKey: 'descriptions.overview', path: '/admin', icon: 'overview', section: 'overview', roles: ['admin'] },
  { id: 'courses', labelKey: 'nav.courses', descriptionKey: 'descriptions.courses', path: '/admin/courses', icon: 'courses', section: 'workspace', roles: ['admin'] },
  { id: 'registrations', labelKey: 'nav.registrations', descriptionKey: 'descriptions.registrations', path: '/admin/registrations', icon: 'registrations', section: 'operations', roles: ['admin'] },
  { id: 'users', labelKey: 'nav.users', descriptionKey: 'descriptions.users', path: '/admin/users', icon: 'users', section: 'system', roles: ['admin'] },
  { id: 'settings', labelKey: 'nav.settings', descriptionKey: 'descriptions.settings', path: '/admin/settings', icon: 'settings', section: 'system', roles: ['admin'] },
  { id: 'assistantRegistrations', labelKey: 'nav.registrations', descriptionKey: 'descriptions.registrations', path: '/assistant/registrations', icon: 'registrations', section: 'operations', roles: ['assistant'] },
];

export function visibleDashboardItems(area: DashboardArea): DashboardNavItem[] {
  return dashboardNav.filter((item) => item.roles.includes(area));
}
