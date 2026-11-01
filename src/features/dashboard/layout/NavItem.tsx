import { BookOpen, LayoutDashboard, Users, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@/components/ui/Overlay';
import { cn } from '@/lib/cn';
import type { DashboardIcon, DashboardNavItem } from '@/features/dashboard/nav.config';

const icons: Record<DashboardIcon, LucideIcon> = { overview: LayoutDashboard, courses: BookOpen, registrations: Users, users: Users, settings: Settings };
export function NavIcon({ name, size = 19, className }: { name: DashboardIcon; size?: number; className?: string }) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" size={size} className={className} />;
}
export function NavItem({ item, collapsed = false, onNavigate }: { item: DashboardNavItem; collapsed?: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation('dashboard');
  const content = <NavLink to={item.path} end={item.id === 'overview'} onClick={onNavigate} className={({ isActive }) => cn('group relative flex min-h-11 items-center gap-3 rounded-sm ps-3 pe-3 text-sm transition duration-250 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', isActive ? 'bg-primary/10 font-semibold text-primary-strong' : 'text-muted hover:bg-canvas hover:text-ink', collapsed && 'justify-center ps-0 pe-0')}>
    <NavIcon name={item.icon} className="shrink-0" /><span className={cn('min-w-0 flex-1 truncate text-start', collapsed && 'sr-only')}>{t(item.labelKey)}</span><span className="sr-only">{t(item.descriptionKey)}</span>
  </NavLink>;
  return collapsed ? <Tooltip content={t(item.labelKey)}>{content}</Tooltip> : content;
}
