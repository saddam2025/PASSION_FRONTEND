import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { forwardRef, type HTMLAttributes, type TableHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const badgeStyles = cva('inline-flex items-center rounded-full ps-2.5 pe-2.5 py-1 text-xs font-semibold', {
  variants: { variant: { default: 'bg-canvas text-muted', success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', danger: 'bg-danger/10 text-danger', info: 'bg-info/10 text-info', primary: 'bg-primary/10 text-primary-strong' } },
  defaultVariants: { variant: 'default' },
});
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeStyles> {}
export function Badge({ variant, className, ...props }: BadgeProps) { return <span className={cn(badgeStyles({ variant }), className)} {...props} />; }
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card({ className, ...props }, ref) {
  return <div ref={ref} className={cn('rounded-lg border border-border bg-surface p-4 shadow-soft transition duration-250 ease-premium hover:border-primary/50 hover:shadow-card sm:p-5', className)} {...props} />;
});
export function Avatar({ name, src, size = 'md' }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase()).join('') || '?';
  const sizeClass = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' }[size];
  return <span className={cn('inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary-strong', sizeClass)} role="img" aria-label={name}>{src ? <img src={src} alt="" className="size-full object-cover" /> : initials}</span>;
}
export function Table({ label, children, className, ...props }: TableHTMLAttributes<HTMLTableElement> & { label: string }) {
  return <div role="region" aria-label={label} tabIndex={0} className="w-full overflow-x-auto rounded-md border border-border focus-visible:ring-2 focus-visible:ring-primary"><table className={cn('w-full border-collapse text-start text-sm', className)} {...props}>{children}</table></div>;
}
export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) { return <thead className={cn('sticky top-0 z-10 bg-canvas text-start text-xs uppercase tracking-wide text-muted', className)} {...props} />; }
export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) { return <tbody className={cn('divide-y divide-border', className)} {...props} />; }
export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) { return <tr className={cn('transition-colors hover:bg-canvas/70', className)} {...props} />; }
export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) { return <th scope="col" className={cn('whitespace-nowrap ps-4 pe-4 py-3 text-start font-semibold', className)} {...props} />; }
export function TableCell({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) { return <td className={cn('ps-4 pe-4 py-3 align-middle text-ink', className)} {...props} />; }
export function Pagination({ page, pages, onPageChange, label }: { page: number; pages: number; onPageChange: (page: number) => void; label?: string }) {
  const { t } = useTranslation('common');
  if (pages <= 1) return null;
  return <nav aria-label={label ?? t('pagination')} className="flex items-center justify-between gap-3">
    <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}><ChevronLeft aria-hidden="true" className="rtl:rotate-180" size={16} /><span>{t('previous')}</span></Button>
    <span className="text-sm text-muted" aria-live="polite">{page} / {pages}</span>
    <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pages}><span>{t('next')}</span><ChevronRight aria-hidden="true" className="rtl:rotate-180" size={16} /></Button>
  </nav>;
}

