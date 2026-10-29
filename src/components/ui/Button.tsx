import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

const buttonVariants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition duration-250 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', {
  variants: {
    variant: {
      primary: 'rounded-xs bg-primary-strong text-white shadow-[0_4px_20px_rgb(2_132_199_/_25%)] hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_8px_32px_rgb(0_210_255_/_35%)]',
      secondary: 'rounded-xs border border-border bg-transparent text-ink hover:border-primary hover:text-primary-strong',
      outline: 'rounded-xs border border-primary/30 bg-primary/5 text-primary-strong hover:bg-primary/10',
      ghost: 'rounded-xs text-ink hover:bg-canvas hover:text-primary-strong',
      danger: 'rounded-xs bg-danger text-white hover:bg-danger/90',
    },
    size: { sm: 'min-h-9 ps-3 pe-3 text-sm', md: 'min-h-11 ps-5 pe-5 text-sm', lg: 'min-h-12 ps-7 pe-7 text-base', icon: 'size-10 rounded-full p-0' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});
export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> & VariantProps<typeof buttonVariants> & { loading?: boolean };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, loading = false, disabled, children, ...props }, ref) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading && <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" size={16} />}{children}
  </button>;
});
export type IconButtonProps = ButtonProps & { 'aria-label': string };
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ size = 'icon', variant = 'ghost', className, ...props }, ref) {
  return <Button ref={ref} size={size} variant={variant} className={cn('shrink-0', className)} {...props} />;
});
