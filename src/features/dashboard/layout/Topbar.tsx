import { useMemo } from 'react';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Bell, Menu, UserRound, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/dataDisplay';
import { useLanguage } from '@/i18n/useLanguage';
import { useAuth } from '@/app/AuthContext';
import { visibleDashboardItems, type DashboardArea } from '@/features/dashboard/nav.config';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/formatters';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsService, type NotificationItem } from '@/services/notifications';
import { resetMockDb, simulateStaleOnce } from '@/mocks/db';
import { useToast } from '@/components/ui/feedback';

export function Topbar({ area, onOpenDrawer }: { area: DashboardArea; onOpenDrawer: () => void }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const items = visibleDashboardItems(area, user?.permissions ?? []);
  const current = useMemo(
    () =>
      items
        .filter(
          (item) =>
            pathname === item.path ||
            (item.id !== 'overview' && pathname.startsWith(`${item.path}/`)),
        )
        .sort((a, b) => b.path.length - a.path.length)[0],
    [items, pathname],
  );
  const unreadQuery = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => notificationsService.unreadCount(),
  });
  const unread = unreadQuery.data ?? 0;
  const userName = user?.name.ar || user?.email || '';

  return (
    <header className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/95 ps-4 pe-4 shadow-soft backdrop-blur-md md:ps-6 md:pe-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label={t('openNavigation')}
          onClick={onOpenDrawer}
          className={cn(
            'inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            'md:hidden',
          )}
        >
          <Menu aria-hidden="true" size={20} />
        </button>
        <nav aria-label={t('breadcrumbs')} className="min-w-0 truncate text-sm">
          <Link to={`/${area}`} className="text-muted hover:text-primary-strong">
            {t(area === 'admin' ? 'nav.overview' : 'nav.courses')}
          </Link>
          {current && current.path !== `/${area}` && (
            <>
              <span aria-hidden="true" className="ps-2 pe-2 text-subtle">
                /
              </span>
              <span aria-current="page" className="font-semibold text-ink">
                {t(current.labelKey)}
              </span>
            </>
          )}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <NotificationsMenu area={area} unread={unread} />
        <Dropdown.Root>
          <Dropdown.Trigger asChild>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-sm ps-2 pe-2 text-start hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={t('userMenu', { name: userName })}
            >
              <span className="hidden text-end sm:block">
                <span className="block max-w-32 truncate text-xs font-semibold text-ink">
                  {userName}
                </span>
                <Badge variant="default" className="mt-0.5">
                  {user?.role === 'admin' ? t('roles.admin') : t('roles.assistant')}
                </Badge>
              </span>
              <UserRound aria-hidden="true" size={19} className="text-muted" />
            </button>
          </Dropdown.Trigger>
          <Dropdown.Portal>
            <Dropdown.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-48 rounded-sm border border-border bg-surface p-1.5 text-ink shadow-elevated"
            >
              <Dropdown.Label className="truncate ps-3 pe-3 py-2 text-xs text-muted">
                {userName}
              </Dropdown.Label>
              {import.meta.env.DEV && (
                <Dropdown.Item
                  onSelect={simulateStaleOnce}
                  className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xs ps-3 pe-3 text-sm text-warning outline-none focus:bg-warning/5"
                >
                  {t('simulateStale')}
                </Dropdown.Item>
              )}
              {import.meta.env.DEV && (
                <Dropdown.Item
                  onSelect={async () => {
                    try {
                      const demo = await import('@/mocks/analyticsDemo.mock');
                      demo.generateAnalyticsDemo();
                      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
                      toast.notify({ title: t('generateDemoData'), tone: 'success' });
                    } catch {
                      toast.notify({ title: t('demoDataError'), tone: 'danger' });
                    }
                  }}
                  className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xs ps-3 pe-3 text-sm outline-none focus:bg-canvas"
                >
                  {t('generateDemoData')}
                </Dropdown.Item>
              )}
              {import.meta.env.DEV && (
                <Dropdown.Item
                  onSelect={async () => {
                    const demo = await import('@/mocks/analyticsDemo.mock');
                    demo.clearAnalyticsDemo();
                    void queryClient.invalidateQueries({ queryKey: ['analytics'] });
                    toast.notify({ title: t('clearDemoData'), tone: 'success' });
                  }}
                  className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xs ps-3 pe-3 text-sm outline-none focus:bg-canvas"
                >
                  {t('clearDemoData')}
                </Dropdown.Item>
              )}
              {import.meta.env.DEV && (
                <Dropdown.Item
                  onSelect={() => {
                    resetMockDb();
                    void queryClient.invalidateQueries();
                  }}
                  className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xs ps-3 pe-3 text-sm text-warning outline-none focus:bg-warning/5"
                >
                  {t('resetMockData')}
                </Dropdown.Item>
              )}
              <Dropdown.Separator className="my-1 h-px bg-border" />
              <Dropdown.Item
                onSelect={() => {
                  void logout().then(() => navigate(`/${language}/login`, { replace: true }));
                }}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xs ps-3 pe-3 text-sm text-danger outline-none focus:bg-danger/5"
              >
                <LogOut aria-hidden="true" size={16} />
                {t('logout')}
              </Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
      </div>
    </header>
  );
}

function NotificationsMenu({ area, unread }: { area: DashboardArea; unread: number }) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const latest = useQuery({
    queryKey: ['notification-latest'],
    queryFn: () => notificationsService.latest(5),
  });
  const openNotification = async (item: NotificationItem) => {
    await notificationsService.markRead(item.id);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
    navigate(
      area === 'admin'
        ? `/admin/review/${item.entityId}`
        : item.type === 'course_submitted'
          ? '/assistant/submissions'
          : `/assistant/courses/${item.courseId ?? item.entityId}`,
    );
  };
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          type="button"
          aria-label={t('notificationsMenu')}
          className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Bell aria-hidden="true" size={19} />
          {unread > 0 && (
            <Badge
              variant="danger"
              className="absolute -top-0.5 end-0 min-w-4 justify-center ps-1 pe-1 py-0 text-[9px]"
            >
              {unread}
            </Badge>
          )}
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[min(92vw,22rem)] rounded-sm border border-border bg-surface p-2 text-ink shadow-elevated"
        >
          <div className="flex items-center justify-between ps-2 pe-2 py-2">
            <h2 className="text-sm font-bold">{t('nav.notifications')}</h2>
            <Badge variant="primary">{unread}</Badge>
          </div>
          {!latest.data?.length ? (
            <p className="ps-3 pe-3 py-6 text-center text-sm text-muted">
              {t('notificationsEmpty')}
            </p>
          ) : (
            <div className="grid gap-1">
              {latest.data.map((item) => (
                <Dropdown.Item
                  key={item.id}
                  onSelect={() => void openNotification(item)}
                  className="grid cursor-pointer gap-1 rounded-xs ps-3 pe-3 py-2 text-start outline-none hover:bg-canvas focus:bg-canvas"
                >
                  <span className="text-sm font-semibold">
                    {t(`notificationTypes.${item.type}`, { ns: 'notifications' })}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(item.createdAt, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </Dropdown.Item>
              ))}
            </div>
          )}
          <Dropdown.Separator className="my-2 h-px bg-border" />
          <Dropdown.Item
            onSelect={() =>
              navigate(area === 'admin' ? '/admin/notifications' : '/assistant/notifications')
            }
            className="min-h-10 cursor-pointer rounded-xs ps-3 pe-3 py-2 text-sm font-semibold text-primary-strong outline-none focus:bg-primary/5"
          >
            {t('viewAllNotifications')}
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
