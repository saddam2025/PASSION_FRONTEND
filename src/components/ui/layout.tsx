import { ChevronRight, Home } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ComponentPropsWithoutRef, PropsWithChildren, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Container({ children, className, ...props }: PropsWithChildren<ComponentPropsWithoutRef<'div'>>) {
  return <div className={cn('mx-auto w-full max-w-[var(--container-max)] ps-container pe-container', className)} {...props}>{children}</div>;
}
export function Section({ children, className, ...props }: PropsWithChildren<ComponentPropsWithoutRef<'section'>>) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  return <section ref={sectionRef} className={cn('py-section transition-[opacity,transform] duration-500 ease-premium motion-reduce:transform-none motion-reduce:transition-none', visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0', className)} {...props}>{children}</section>;
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



