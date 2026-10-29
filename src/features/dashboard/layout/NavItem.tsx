import {
  Bell,
  BookOpen,
  ChartNoAxesCombined,
  ClipboardCheck,
  CreditCard,
  FileClock,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/dataDisplay';
import { Tooltip } from '@/components/ui/Overlay';
import { cn } from '@/lib/cn';
import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications';
import { revisionsService } from '@/services/revisions';
import type { DashboardIcon, DashboardNavItem } from '@/features/dashboard/nav.config';

const icons: Record<DashboardIcon, LucideIcon> = {
  overview: LayoutDashboard,
  chart: ChartNoAxesCombined,
  courses: BookOpen,
  review: ClipboardCheck,
  leads: Users,
  payments: CreditCard,
  users: Users,
  bell: Bell,
  audit: FileClock,
  settings: Settings,
};

export function NavIcon({
  name,
  size = 19,
  className,
}: {
  name: DashboardIcon;
  size?: number;
  className?: string;
}) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" size={size} className={className} />;
}

export function NavItem({
  item,
  collapsed = false,
  onNavigate,
}: {
  item: DashboardNavItem;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation('dashboard');
  const countQuery = useQuery({
    queryKey: ['nav-count', item.countKey],
    enabled: Boolean(item.countKey),
    queryFn: () =>
      item.countKey === 'pendingReviews'
        ? revisionsService.listQueue().then((items) => items.length)
        : notificationsService.unreadCount(),
  });
  const count = countQuery.data ?? 0;
  const content = (
    <NavLink
      to={item.path}
      end={item.id === 'overview'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex min-h-11 items-center gap-3 rounded-sm ps-3 pe-3 text-sm transition duration-250 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isActive
            ? 'bg-primary/10 font-semibold text-primary-strong'
            : 'text-muted hover:bg-canvas hover:text-ink',
          collapsed && 'justify-center ps-0 pe-0',
        )
      }
    >
      <NavIcon name={item.icon} className="shrink-0" />
      <span className={cn('min-w-0 flex-1 truncate text-start', collapsed && 'sr-only')}>
        {t(item.labelKey)}
      </span>
      {count > 0 && (
        <Badge
          variant="primary"
          className={cn(
            'min-w-6 justify-center ps-1.5 pe-1.5 py-0.5 tabular-nums',
            collapsed && 'absolute -top-1 end-0 min-w-5 text-[10px]',
          )}
        >
          {count}
        </Badge>
      )}
      <span className="sr-only">{t(item.descriptionKey)}</span>
    </NavLink>
  );

  return collapsed ? <Tooltip content={t(item.labelKey)}>{content}</Tooltip> : content;
}
