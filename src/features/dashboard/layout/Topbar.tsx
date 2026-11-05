import { useMemo } from 'react';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Menu, UserRound, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/dataDisplay';
import { SmartImage } from '@/components/common/SmartImage';
import { useLanguage } from '@/i18n/useLanguage';
import { useAuth } from '@/app/AuthContext';
import { visibleDashboardItems, type DashboardArea } from '@/features/dashboard/nav.config';
import type { PublicSettings } from '@/services/settings.types';
import { cn } from '@/lib/cn';

export function Topbar({ area, onOpenDrawer, settings }: { area: DashboardArea; onOpenDrawer: () => void; settings: PublicSettings }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(['dashboard', 'nav']);
  const navigate = useNavigate();
  const academyName = settings.academyName.ar.trim();
  const items = visibleDashboardItems(area);
  const current = useMemo(() => items
    .filter((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0], [items, pathname]);
  const userName = user?.name.ar || user?.email || '';

  return (
    <header className="sticky top-2 z-30 mx-2 flex min-h-16 shrink-0 items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface/90 ps-4 pe-4 shadow-card backdrop-blur-md md:mx-4 md:ps-6 md:pe-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link to={`/${area}`} aria-label={academyName || t('nav:dashboard')} className="flex shrink-0 items-center gap-2 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <SmartImage slot="logo" srcOverride={settings.logo || undefined} alt={academyName || t('nav:dashboard')} width={120} height={40} className="h-auto w-48 shrink-0 object-contain" />
          {academyName && <span className="hidden max-w-28 truncate text-xs font-bold text-ink xl:block">{academyName}</span>}
        </Link>
        {current?.id !== 'overview' && <nav aria-label={t('breadcrumbs')} className="min-w-0 truncate text-sm">
          <Link to={`/${area}`} className="text-muted hover:text-primary-strong">{t(area === 'admin' ? 'nav.overview' : 'nav.registrations')}</Link>
          {current && current.path !== `/${area}` && <><span aria-hidden="true" className="ps-2 pe-2 text-subtle">/</span><span aria-current="page" className="font-semibold text-ink">{t(current.labelKey)}</span></>}
        </nav>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Dropdown.Root>
          <Dropdown.Trigger asChild><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-sm ps-2 pe-2 text-start hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={t('userMenu', { name: userName })}>
            <span className="hidden text-end sm:block"><span className="block max-w-32 truncate text-xs font-semibold text-ink">{userName}</span><Badge variant="default" className="mt-0.5">{user?.role === 'admin' ? t('roles.admin') : t('roles.assistant')}</Badge></span><UserRound aria-hidden="true" size={19} className="text-muted" />
          </button></Dropdown.Trigger>
          <Dropdown.Portal><Dropdown.Content align="end" sideOffset={6} className="z-50 min-w-48 rounded-sm border border-border bg-surface p-1.5 text-ink shadow-elevated">
            <Dropdown.Label className="truncate ps-3 pe-3 py-2 text-xs text-muted">{userName}</Dropdown.Label><Dropdown.Separator className="my-1 h-px bg-border" />
            <Dropdown.Item onSelect={() => { void logout().then(() => navigate(`/${language}/login`, { replace: true })); }} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xs ps-3 pe-3 text-sm text-danger outline-none focus:bg-danger/5"><LogOut aria-hidden="true" size={16} />{t('logout')}</Dropdown.Item>
          </Dropdown.Content></Dropdown.Portal>
        </Dropdown.Root>
        <button type="button" aria-label={t('openNavigation')} onClick={onOpenDrawer} className={cn('inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', 'md:hidden')}>
          <Menu aria-hidden="true" size={20} />
        </button>
      </div>
    </header>
  );
}
