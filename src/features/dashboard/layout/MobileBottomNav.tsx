import { motion, useReducedMotion } from 'framer-motion';
import { MoreHorizontal, Plus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/dataDisplay';
import { IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications';
import { revisionsService } from '@/services/revisions';
import { NavIcon } from '@/features/dashboard/layout/NavItem';
import {
  visibleDashboardItems,
  type DashboardArea,
  type DashboardNavItem,
} from '@/features/dashboard/nav.config';
import { useAuth } from '@/app/AuthContext';
import { useNewCourseDialog } from '@/features/courses/newCourseDialogStore';

export function MobileBottomNav({ area, onMore }: { area: DashboardArea; onMore: () => void }) {
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');
  const newCourse = useNewCourseDialog();
  const items = visibleDashboardItems(area, user?.permissions ?? []).slice(0, 3);
  return (
    <nav
      aria-label={t('mobileNavigation')}
      className="fixed start-0 end-0 bottom-0 z-40 grid grid-cols-5 items-end border-t border-border bg-surface/95 ps-2 pe-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-soft backdrop-blur-md md:hidden"
    >
      {items.slice(0, 2).map((item) => (
        <MobileNavItem key={item.id} item={item} />
      ))}
      {user && (user.role === 'admin' || user.role === 'assistant') && (
        <button
          type="button"
          aria-label={t('newCourse')}
          onClick={newCourse.open}
          className="relative -mt-6 flex min-h-14 min-w-14 flex-col items-center justify-center justify-self-center rounded-full bg-primary-strong text-white shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus aria-hidden="true" size={22} />
          <span className="sr-only">{t('newCourse')}</span>
        </button>
      )}
      {items.slice(2, 3).map((item) => (
        <MobileNavItem key={item.id} item={item} />
      ))}
      <IconButton
        variant="ghost"
        aria-label={t('more')}
        onClick={onMore}
        className="min-h-11 w-full flex-col gap-1 rounded-sm ps-1 pe-1 py-1 text-[10px] text-muted"
      >
        <MoreHorizontal aria-hidden="true" size={20} />
        <span>{t('more')}</span>
      </IconButton>
    </nav>
  );
}

function MobileNavItem({ item }: { item: DashboardNavItem }) {
  const { t } = useTranslation('dashboard');
  const reduceMotion = useReducedMotion();
  const countQuery = useQuery({
    queryKey: ['nav-count', item.countKey],
    enabled: Boolean(item.countKey),
    queryFn: () =>
      item.countKey === 'pendingReviews'
        ? revisionsService.listQueue().then((items) => items.length)
        : notificationsService.unreadCount(),
  });
  const count = countQuery.data ?? 0;
  return (
    <NavLink
      to={item.path}
      end={item.id === 'overview'}
      aria-label={t(item.labelKey)}
      className={({ isActive }) =>
        cn(
          'relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-sm ps-1 pe-1 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isActive ? 'font-semibold text-primary-strong' : 'text-muted',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="dashboard-mobile-active"
              className="absolute start-1 end-1 top-0 h-0.5 rounded-full bg-primary"
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            />
          )}
          <span className="relative">
            <NavIcon name={item.icon} size={19} />
            {count > 0 && (
              <Badge
                variant="primary"
                className="absolute -top-2 -end-3 min-w-4 justify-center ps-1 pe-1 py-0 text-[9px]"
              >
                {count}
              </Badge>
            )}
          </span>
          <span className="max-w-full truncate">{t(item.labelKey)}</span>
        </>
      )}
    </NavLink>
  );
}
