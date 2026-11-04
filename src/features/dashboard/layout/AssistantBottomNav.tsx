import { LogOut, Search, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/AuthContext';
import { useLanguage } from '@/i18n/useLanguage';
import { cn } from '@/lib/cn';

const registrationsPath = '/assistant/registrations';

export function AssistantBottomNav() {
  const { t } = useTranslation('dashboard');
  const { logout } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnRegistrations = location.pathname.startsWith(registrationsPath);
  const itemClass = 'flex min-h-14 flex-col items-center justify-center gap-1 rounded-sm px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  const focusSearch = () => {
    if (isOnRegistrations) document.getElementById('lead-search')?.focus();
  };

  return (
    <nav aria-label={t('mobileNavigation')} className="z-30 shrink-0 border-t border-border bg-surface/95 px-3 pt-1 shadow-soft backdrop-blur-md pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto grid w-full max-w-md grid-cols-3 justify-items-center">
        <Link to={`${registrationsPath}#lead-search`} onClick={focusSearch} className={cn(itemClass, 'text-muted hover:text-primary-strong')} aria-label={t('searchAction')}>
          <Search aria-hidden="true" size={20} />
          <span>{t('searchAction')}</span>
        </Link>
        <Link to={registrationsPath} className={cn(itemClass, isOnRegistrations ? 'font-semibold text-primary-strong' : 'text-muted hover:text-primary-strong')} aria-label={t('nav.registrations')}>
          <Users aria-hidden="true" size={20} />
          <span>{t('nav.registrations')}</span>
        </Link>
        <button type="button" onClick={() => { void logout().then(() => navigate(`/${language}/login`, { replace: true })); }} className={cn(itemClass, 'text-muted hover:text-danger')} aria-label={t('logout')}>
          <LogOut aria-hidden="true" size={20} />
          <span>{t('logout')}</span>
        </button>
      </div>
    </nav>
  );
}
