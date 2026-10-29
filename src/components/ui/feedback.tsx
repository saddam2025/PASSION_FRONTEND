import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Inbox, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Spinner({ label, className }: { label?: string; className?: string }) {
  const { t } = useTranslation('common');
  return <span role="status" className={cn('inline-flex items-center gap-2 text-sm text-muted', className)}><LoaderCircle aria-hidden="true" className="animate-spin text-primary-strong motion-reduce:animate-none" size={18} /><span>{label ?? t('loading')}</span></span>;
}
export function Skeleton({ className, variant = 'text' }: { className?: string; variant?: 'text' | 'title' | 'avatar' | 'card' }) {
  const shape = { text: 'h-4 w-full rounded-xs', title: 'h-7 w-2/3 rounded-xs', avatar: 'size-10 rounded-full', card: 'min-h-36 w-full rounded-md' }[variant];
  return <span aria-hidden="true" className={cn('block animate-pulse bg-border/70 motion-reduce:animate-none', shape, className)} />;
}
export function RouteSkeleton() {
  const { t } = useTranslation('common');
  return <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-6 ps-container pe-container py-section" aria-label={t('loading')}><Skeleton variant="title" /><Skeleton variant="text" className="max-w-xl" /><div className="grid gap-4 sm:grid-cols-2"><Skeleton variant="card" /><Skeleton variant="card" /></div></main>;
}
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <section className="grid justify-items-center gap-3 rounded-md border border-dashed border-border bg-surface ps-6 pe-6 py-12 text-center" aria-live="polite"><span className="grid size-12 place-items-center rounded-full bg-canvas text-muted"><Inbox aria-hidden="true" size={22} /></span><h2 className="text-lg font-bold">{title}</h2>{description && <p className="max-w-md text-sm text-muted">{description}</p>}{action}</section>;
}
export function ErrorState({ title, description, onRetry }: { title: string; description?: string; onRetry?: () => void }) {
  const { t } = useTranslation('errors');
  return <section className="grid justify-items-center gap-3 rounded-md border border-danger/20 bg-danger/5 ps-6 pe-6 py-12 text-center" role="alert"><AlertTriangle aria-hidden="true" className="text-danger" size={24} /><h2 className="text-lg font-bold">{title}</h2>{description && <p className="max-w-md text-sm text-muted">{description}</p>}{onRetry && <button type="button" className="font-semibold text-primary-strong underline underline-offset-4" onClick={onRetry}>{t('retry')}</button>}</section>;
}
export type ToastTone = 'info' | 'success' | 'warning' | 'danger';
export interface ToastMessage { id: number; title: string; description?: string; tone: ToastTone; action?: { label: string; href: string } }
interface ToastContextValue { notify: (message: Omit<ToastMessage, 'id'>) => void; dismiss: (id: number) => void }
const ToastContext = createContext<ToastContextValue | null>(null);
const toneClass: Record<ToastTone, string> = { info: 'border-info/30', success: 'border-success/30', warning: 'border-warning/30', danger: 'border-danger/30' };

export function ToastProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation('common');
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);
  const dismiss = useCallback((id: number) => setMessages((current) => current.filter((item) => item.id !== id)), []);
  const notify = useCallback((message: Omit<ToastMessage, 'id'>) => setMessages((current) => [...current, { ...message, id: ++nextId.current }]), []);
  useEffect(() => {
    if (!messages.length) return;
    const timers = messages.map((message) => window.setTimeout(() => dismiss(message.id), 5000));
    return () => timers.forEach(window.clearTimeout);
  }, [messages, dismiss]);
  const contextValue = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);
  return <ToastContext.Provider value={contextValue}>{children}<div className="pointer-events-none fixed start-0 end-0 top-4 z-[100] mx-auto grid w-[min(92vw,24rem)] gap-2" aria-live="polite" aria-relevant="additions">
    {messages.map((message) => <div key={message.id} className={cn('pointer-events-auto rounded-sm border bg-surface p-4 text-ink shadow-elevated', toneClass[message.tone])} role={message.tone === 'danger' ? 'alert' : 'status'}>
      <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{message.title}</p>{message.description && <p className="mt-1 text-sm text-muted">{message.description}</p>}{message.action && <a href={message.action.href} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary-strong underline">{message.action.label}</a>}</div><button type="button" className="text-sm text-muted underline" onClick={() => dismiss(message.id)}>{t('dismiss')}</button></div>
    </div>)}
  </div></ToastContext.Provider>;
}
export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider.');
  return value;
}

