import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/feedback';
import { PageHeader } from '@/features/dashboard/layout/PageHeader';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { visibleDashboardItems, type DashboardArea } from '@/features/dashboard/nav.config';

export function DashboardRoutePage({ area }: { area: DashboardArea }) {
  const { pathname } = useLocation();
  const { t } = useTranslation('dashboard');
  const accessible = visibleDashboardItems(area);
  const item = accessible.find((entry) => pathname === entry.path);
  const base = `/${area}`;
  const title = item ? t(item.labelKey) : t('nav.accessDenied');
  useDocumentTitle(title);

  if (pathname === base && area === 'assistant')
    return <Navigate to={accessible[0]?.path ?? '/not-authorized'} replace />;
  if (!item)
    return (
      <>
        <PageHeader
          title={title}
          breadcrumbs={[{ label: t('title'), href: base }, { label: title }]}
        />
        <EmptyState title={t('accessDenied')} description={t('accessDeniedDescription')} />
      </>
    );

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[{ label: t('title'), href: base }, { label: title }]}
      />
      <EmptyState title={t('accessDenied')} description={t('accessDeniedDescription')} />
    </>
  );
}



