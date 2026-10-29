import { useLocation, useNavigate } from 'react-router-dom';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/i18n/useLanguage';
import { Button } from '@/components/ui/Button';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation('nav');
  const location = useLocation();
  const navigate = useNavigate();
  const next = language === 'ar' ? 'en' : 'ar';
  const nextLabel = t('language', { lng: next });
  const changeLanguage = () => {
    setLanguage(next);
    const segments = location.pathname.split('/');
    const hasLanguagePrefix = segments[1] === 'ar' || segments[1] === 'en';
    const staysUnprefixed = location.pathname.startsWith('/dev/') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/assistant');
    const nextPath = hasLanguagePrefix
      ? `/${next}/${segments.slice(2).join('/')}`
      : staysUnprefixed
        ? location.pathname
        : `/${next}${location.pathname}`;
    navigate({ pathname: nextPath.replace(/\/$/, '') || `/${next}`, search: location.search, hash: location.hash }, { state: location.state });
  };
  return <Button type="button" variant="secondary" size="sm" aria-label={nextLabel} onClick={changeLanguage}>
    <Languages aria-hidden="true" size={16} /><span>{nextLabel}</span>
  </Button>;
}
