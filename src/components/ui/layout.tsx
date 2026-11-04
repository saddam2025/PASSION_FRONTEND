import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ComponentPropsWithoutRef, PropsWithChildren, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Container({ children, className, ...props }: PropsWithChildren<ComponentPropsWithoutRef<'div'>>) {
  return <div className={cn('mx-auto w-full max-w-[var(--container-max)] ps-container pe-container', className)} {...props}>{children}</div>;
}
export function Section({ children, className, ...props }: PropsWithChildren<ComponentPropsWithoutRef<'section'>>) {
  return <section className={cn('py-section', className)} {...props}>{children}</section>;
}
export interface BreadcrumbItem { label: string; href?: string }
export function Breadcrumbs({ items, homeLabel }: { items: BreadcrumbItem[]; homeLabel?: string }) {
  const { t } = useTranslation('common');
  const rootLabel = homeLabel ?? t('home');
  return <nav aria-label="مسار التنقل"><ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
    <li><Link to="/" aria-label={rootLabel} className="inline-flex items-center gap-1 hover:text-primary-strong"><Home aria-hidden="true" size={15} /><span>{rootLabel}</span></Link></li>
    {items.map((item, index) => <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
      <ChevronRight aria-hidden="true" className="rtl:rotate-180" size={14} />{item.href && index < items.length - 1 ? <Link to={item.href} className="hover:text-primary-strong">{item.label}</Link> : <span aria-current="page" className="font-medium text-ink">{item.label}</span>}
    </li>)}
  </ol></nav>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><div className="grid gap-2">{eyebrow && <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">{eyebrow}</p>}<h1 className="font-display text-4xl font-bold leading-tight text-ink">{title}</h1>{description && <p className="max-w-2xl text-base text-muted">{description}</p>}</div>{action}</header>;
}



