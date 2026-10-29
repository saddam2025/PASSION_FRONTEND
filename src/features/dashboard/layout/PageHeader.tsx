import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface DashboardCrumb { label: string; href?: string }
export function PageHeader({ title, description, breadcrumbs, actions }: {
  title: string;
  description?: string;
  breadcrumbs: DashboardCrumb[];
  actions?: ReactNode;
}) {
  const { t } = useTranslation('dashboard');
  return (
    <header className="grid gap-4 border-b border-border pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="grid min-w-0 gap-3">
        <nav aria-label={t('breadcrumbs')}>
          <ol className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {breadcrumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`} className="inline-flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {crumb.href && index < breadcrumbs.length - 1
                ? <Link to={crumb.href} className="hover:text-primary-strong">{crumb.label}</Link>
                : <span aria-current="page" className="font-medium text-ink">{crumb.label}</span>}
            </li>)}
          </ol>
        </nav>
        <div className="grid gap-1.5"><h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">{title}</h1>{description && <p className="max-w-2xl text-sm text-muted sm:text-base">{description}</p>}</div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
