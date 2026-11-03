import { MoreHorizontal } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { NavIcon } from '@/features/dashboard/layout/NavItem';
import { visibleDashboardItems, type DashboardArea, type DashboardNavItem } from '@/features/dashboard/nav.config';

export function MobileBottomNav({ area, onMore }: { area: DashboardArea; onMore: () => void }) {
  const { t } = useTranslation('dashboard');
  const items = visibleDashboardItems(area).slice(0, 4);
  return <nav aria-label={t('mobileNavigation')} className="fixed start-0 end-0 bottom-0 z-40 grid grid-cols-[repeat(4,minmax(0,1fr))_3rem] items-end border-t border-border bg-surface/95 ps-2 pe-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-soft backdrop-blur-md md:hidden">
    {items.map((item) => <MobileNavItem key={item.id} item={item} />)}
    <IconButton variant="ghost" aria-label={t('more')} onClick={onMore} className="min-h-11 w-full flex-col gap-1 rounded-sm ps-1 pe-1 py-1 text-[10px] text-muted"><MoreHorizontal aria-hidden="true" size={20} /><span>{t('more')}</span></IconButton>
  </nav>;
}
function MobileNavItem({ item }: { item: DashboardNavItem }) {
  const { t } = useTranslation('dashboard');
  return <NavLink to={item.path} end={item.id === 'overview'} aria-label={t(item.labelKey)} className={({ isActive }) => cn('relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-sm ps-1 pe-1 text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', isActive ? 'font-semibold text-primary-strong' : 'text-muted')}><NavIcon name={item.icon} size={19} /><span>{t(item.labelKey)}</span></NavLink>;
}
