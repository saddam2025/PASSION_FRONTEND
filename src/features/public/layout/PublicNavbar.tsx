import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import {
  ArrowUpRight,
  MessageCircle,
  LogIn,
  LayoutDashboard,
  LogOut,
  UserRound,
} from 'lucide-react';
import { SmartImage } from '@/components/common/SmartImage';
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher';
import { useLanguage } from '@/i18n/useLanguage';
import { usePublicSettings } from '@/services/usePublicSettings';
import { cn } from '@/lib/cn';
import { whatsappUrl } from '@/features/public/layout/whatsapp';
import { useAuth } from '@/app/AuthContext';

export function PublicNavbar() {
  const [solid, setSolid] = useState(false);
  const { language } = useLanguage();
  const { t } = useTranslation(['nav', 'auth']);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const settings = usePublicSettings();
  const academyName =
    settings.academyName[language].trim() ||
    settings.academyName[language === 'ar' ? 'en' : 'ar'].trim();
  const whatsappHref = whatsappUrl(settings.whatsappNumber, t('nav:whatsappGreeting'));

  useEffect(() => {
    const update = () => setSolid(window.scrollY > 8);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [pathname]);

  const home = `/${language}`;
  const section = (id: string) => (pathname === home ? `#${id}` : `${home}#${id}`);
  const dashboardPath = user?.role === 'assistant' ? '/assistant' : '/admin';
  const userName =
    user?.name[language] || user?.name[language === 'ar' ? 'en' : 'ar'] || user?.email || '';
  return (
    <header
      className={cn(
        'sticky top-0 z-40 -mb-16 border-b border-transparent transition duration-250',
        solid && 'border-border/80 bg-surface/95 shadow-soft backdrop-blur-md',
      )}
    >
      <div className="ms-auto me-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 ps-container pe-container">
        <Link
          to={home}
          className="flex min-w-0 items-center gap-2"
          aria-label={academyName || t('nav:home')}
        >
          <SmartImage
            slot="logo"
            alt={academyName}
            width={120}
            height={40}
            srcOverride={settings.logo || undefined}
            className="h-10 w-36 object-contain"
          />
          {academyName && (
            <span className="hidden truncate font-display text-sm font-bold text-ink sm:inline">
              {academyName}
            </span>
          )}
        </Link>
        <nav aria-label={t('nav:mainNavigation')} className="hidden items-center gap-1 lg:flex">
          <Link
            to={home}
            className="min-h-11 rounded-full ps-3 pe-3 py-2 text-sm text-muted hover:bg-canvas hover:text-primary-strong"
          >
            {t('nav:home')}
          </Link>
          <Link
            to={`${home}/courses`}
            className="min-h-11 rounded-full ps-3 pe-3 py-2 text-sm text-muted hover:bg-canvas hover:text-primary-strong"
          >
            {t('nav:courses')}
          </Link>
          <a
            href={section('about')}
            className="min-h-11 rounded-full ps-3 pe-3 py-2 text-sm text-muted hover:bg-canvas hover:text-primary-strong"
          >
            {t('nav:about')}
          </a>
          <a
            href={section('faq')}
            className="min-h-11 rounded-full ps-3 pe-3 py-2 text-sm text-muted hover:bg-canvas hover:text-primary-strong"
          >
            {t('nav:faq')}
          </a>
          <a
            href={section('contact')}
            className="min-h-11 rounded-full ps-3 pe-3 py-2 text-sm text-muted hover:bg-canvas hover:text-primary-strong"
          >
            {t('nav:contact')}
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link
                to={dashboardPath}
                className="hidden min-h-10 items-center gap-2 rounded-pill border border-border px-3 text-sm text-ink hover:border-primary lg:inline-flex"
              >
                <LayoutDashboard aria-hidden="true" size={16} />
                {t('nav:dashboard')}
              </Link>
              <Dropdown.Root>
                <Dropdown.Trigger asChild>
                  <button
                    type="button"
                    aria-label={t('nav:userMenu', { name: userName })}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill border border-border text-muted hover:text-primary"
                  >
                    <UserRound aria-hidden="true" size={18} />
                  </button>
                </Dropdown.Trigger>
                <Dropdown.Portal>
                  <Dropdown.Content
                    align="end"
                    className="z-50 grid min-w-48 gap-1 rounded-sm border border-border bg-surface p-2 shadow-elevated"
                  >
                    <Dropdown.Label className="truncate px-3 py-2 text-xs text-muted">
                      {userName}
                    </Dropdown.Label>
                    <Dropdown.Item asChild>
                      <Link
                        to={dashboardPath}
                        className="flex min-h-10 items-center gap-2 rounded-xs px-3 text-sm outline-none focus:bg-canvas"
                      >
                        <LayoutDashboard size={16} />
                        {t('nav:dashboard')}
                      </Link>
                    </Dropdown.Item>
                    <Dropdown.Item
                      onSelect={() => void logout().then(() => navigate(home))}
                      className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xs px-3 text-sm text-danger outline-none focus:bg-danger/5"
                    >
                      <LogOut size={16} />
                      {t('nav:logout')}
                    </Dropdown.Item>
                  </Dropdown.Content>
                </Dropdown.Portal>
              </Dropdown.Root>
            </>
          ) : (
            <Link
              to={`/${language}/login`}
              aria-label={t('auth:loginTitle')}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill text-muted hover:bg-canvas hover:text-primary lg:min-w-0 lg:px-3 lg:text-sm"
            >
              <LogIn aria-hidden="true" size={18} />
              <span className="hidden lg:inline">{t('nav:login')}</span>
            </Link>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              className="hidden min-h-11 items-center gap-2 rounded-xs sm:inline-flex bg-primary-strong ps-5 pe-5 text-sm font-semibold text-on-primary shadow-soft transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden="true" size={17} />
              {t('nav:whatsapp')}
              <ArrowUpRight aria-hidden="true" className="rtl:rotate-180" size={15} />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
