import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/dataDisplay';
import { IconButton } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Overlay';
import { SmartImage } from '@/components/common/SmartImage';
import { useAuth } from '@/app/AuthContext';
import { NavItem } from '@/features/dashboard/layout/NavItem';
import {
  visibleDashboardItems,
  type DashboardArea,
  type DashboardSection,
} from '@/features/dashboard/nav.config';
import { usePublicSettings } from '@/services/usePublicSettings';
import { cn } from '@/lib/cn';
import { useNewCourseDialog } from '@/features/courses/newCourseDialogStore';

const sections: DashboardSection[] = ['overview', 'workspace', 'operations', 'system'];

export function Sidebar({
  area,
  collapsed,
  onCollapse,
  onNavigate,
  drawer = false,
}: {
  area: DashboardArea;
  collapsed: boolean;
  onCollapse?: () => void;
  onNavigate?: () => void;
  drawer?: boolean;
}) {
  const { user } = useAuth();
  const { t } = useTranslation(['dashboard', 'nav']);
  const settings = usePublicSettings();
  const newCourse = useNewCourseDialog();
  const items = visibleDashboardItems(area, user?.permissions ?? []);
  const academyName = settings.academyName.ar.trim();
  const grouped = sections
    .map((section) => ({ section, items: items.filter((item) => item.section === section) }))
    .filter((group) => group.items.length > 0);
  const isCollapsed = collapsed && !drawer;

  return (
    <aside
      className={cn(
        'flex h-dvh shrink-0 flex-col border-e border-border bg-surface transition-[width] duration-250 ease-premium',
        drawer ? 'w-72' : isCollapsed ? 'w-[4.5rem]' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-border ps-4 pe-4',
          isCollapsed && 'justify-center ps-2 pe-2',
        )}
      >
        <Link
          to={`/${area}`}
          aria-label={academyName || t('nav:dashboard')}
          className="flex min-w-0 items-center gap-3"
          onClick={onNavigate}
        >
          <SmartImage
            slot="logo"
            alt={academyName}
            width={120}
            height={40}
            className="h-9 w-12 shrink-0 object-contain"
          />
          {!isCollapsed && academyName && (
            <span className="truncate font-display text-sm font-bold text-ink">{academyName}</span>
          )}
        </Link>
      </div>

      <nav
        aria-label={t('nav:dashboard')}
        className="dashboard-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain ps-3 pe-3 py-4"
      >
        <div className="grid gap-5">
          {user && (user.role === 'admin' || user.role === 'assistant') && (
            <Tooltip content={t('newCourse')}>
              <button
                type="button"
                aria-label={t('newCourse')}
                onClick={() => {
                  newCourse.open();
                  onNavigate?.();
                }}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-xs bg-primary-strong px-3 text-sm font-semibold text-white shadow-soft hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isCollapsed ? 'w-11 justify-center px-0' : 'w-full justify-start',
                )}
              >
                <Plus aria-hidden="true" size={19} />
                <span className={cn(isCollapsed && 'sr-only')}>{t('newCourse')}</span>
              </button>
            </Tooltip>
          )}
          {grouped.map(({ section, items: sectionItems }) => (
            <section key={section} aria-label={t(`sections.${section}`)} className="grid gap-1">
              {!isCollapsed && (
                <h2 className="ps-3 pe-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-subtle">
                  {t(`sections.${section}`)}
                </h2>
              )}
              {sectionItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  collapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </section>
          ))}
        </div>
      </nav>

      <footer
        className={cn(
          'grid shrink-0 gap-3 border-t border-border ps-3 pe-3 py-3',
          isCollapsed && 'justify-items-center ps-2 pe-2',
        )}
      >
        {user && (
          <div className={cn('flex min-w-0 items-center gap-3', isCollapsed && 'justify-center')}>
            <Avatar
              name={user.name.ar || user.email}
            />
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {user.name.ar}
                </p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            )}
          </div>
        )}
        {!drawer && onCollapse && (
          <Tooltip content={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}>
            <IconButton
              aria-label={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
              variant="ghost"
              className={cn('min-h-11 w-full rounded-sm', isCollapsed ? 'w-11' : 'justify-start')}
              onClick={onCollapse}
            >
              {isCollapsed ? (
                <PanelLeftOpen aria-hidden="true" size={18} />
              ) : (
                <PanelLeftClose aria-hidden="true" size={18} />
              )}
              <span className={cn(isCollapsed && 'sr-only')}>
                {isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
              </span>
            </IconButton>
          </Tooltip>
        )}
      </footer>
    </aside>
  );
}
