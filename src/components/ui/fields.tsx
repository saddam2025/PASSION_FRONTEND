import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn('min-h-11 w-full rounded-sm border border-border bg-surface ps-3.5 pe-3.5 py-3 text-base text-ink placeholder:text-subtle focus-visible:border-primary focus-visible:shadow-focus aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-60', className)} {...props} />;
});
export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(function PasswordInput({ className, 'aria-label': ariaLabel, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation('common');
  return <span className="relative block">
    <Input ref={ref} type={visible ? 'text' : 'password'} className={cn('pe-12', className)} aria-label={ariaLabel ?? t('password')} {...props} />
    <button type="button" className="absolute inset-y-0 end-2 inline-flex items-center justify-center rounded-sm ps-2 pe-2 text-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-primary" aria-label={visible ? t('hidePassword') : t('showPassword')} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
      {visible ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
    </button>
  </span>;
});
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn('min-h-28 w-full resize-y rounded-sm border border-border bg-surface ps-3.5 pe-3.5 py-3 text-base text-ink placeholder:text-subtle focus-visible:border-primary focus-visible:shadow-focus aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-60', className)} {...props} />;
});


