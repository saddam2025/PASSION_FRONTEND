import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageTransition } from '@/components/common/motion';
import { Container, Section } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
export default function NotAuthorizedPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { language } = useLanguage();
  useDocumentTitle(t('dashboard:unauthorized'));
  return <PageTransition><Section><Container className="grid justify-items-center gap-4 text-center"><p className="font-mono text-sm font-bold text-danger">403</p><h1 className="text-3xl font-bold">{t('dashboard:unauthorized')}</h1><p className="max-w-xl text-muted">{t('dashboard:accessDeniedDescription')}</p><Link className="inline-flex min-h-11 items-center justify-center rounded-xs bg-primary-strong ps-5 pe-5 text-sm font-semibold text-on-primary shadow-soft focus-visible:ring-2 focus-visible:ring-primary" to={`/${language}`}>{t('common:goHome')}</Link></Container></Section></PageTransition>;
}
