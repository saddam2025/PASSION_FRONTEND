import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PropsWithChildren, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface ModalProps extends PropsWithChildren {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: ReactNode;
}
export function Modal({ open, onOpenChange, title, description, children, footer }: ModalProps) {
  const { t } = useTranslation('common');
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-secondary/60 backdrop-blur-sm transition-opacity duration-250 data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <DialogPrimitive.Content className="fixed start-1/2 top-1/2 z-50 grid max-h-[min(88vh,48rem)] w-[min(92vw,36rem)] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-lg border border-border bg-surface p-6 text-ink shadow-elevated focus:outline-none rtl:translate-x-1/2">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <DialogPrimitive.Title className="text-xl font-bold">{title}</DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-sm text-muted">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label={t('close')}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-muted hover:bg-canvas focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </DialogPrimitive.Close>
          </div>
          {children}
          {footer && <div className="flex flex-wrap justify-end gap-2">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
export interface MenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
}
export function DropdownMenu({ label, items }: { label: string; items: MenuItem[] }) {
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild>
        <Button variant="secondary">
          <span>{label}</span>
          <ChevronDown aria-hidden="true" size={16} />
        </Button>
      </DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-40 rounded-sm border border-border bg-surface p-1 text-ink shadow-elevated"
        >
          {items.map((item) => (
            <DropdownPrimitive.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-4 rounded-xs ps-3 pe-3 py-2 text-sm outline-none focus:bg-primary/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                item.destructive && 'text-danger',
              )}
            >
              <span>{item.label}</span>
              <ChevronRight aria-hidden="true" className="rtl:rotate-180" size={14} />
            </DropdownPrimitive.Item>
          ))}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}
export function Tooltip({ content, children }: PropsWithChildren<{ content: string }>) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={6}
          className="z-[60] rounded-xs bg-secondary ps-2.5 pe-2.5 py-1.5 text-xs text-white shadow-card"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-secondary" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
export function TooltipProvider({ children }: PropsWithChildren) {
  return <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>;
}
