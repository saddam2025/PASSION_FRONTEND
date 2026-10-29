import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioPrimitive from '@radix-ui/react-radio-group';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/cn';

export type CheckboxProps = Omit<CheckboxPrimitive.CheckboxProps, 'asChild'>;
export function Checkbox({ className, ...props }: CheckboxProps) {
  return <CheckboxPrimitive.Root className={cn('grid size-5 shrink-0 place-items-center rounded-xs border border-border bg-surface text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary', className)} {...props}><CheckboxPrimitive.Indicator><Check aria-hidden="true" size={14} /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root>;
}

export interface RadioOption { value: string; label: string; disabled?: boolean }
export interface RadioGroupProps extends Omit<RadioPrimitive.RadioGroupProps, 'children'> { options: RadioOption[] }
export function RadioGroup({ options, className, ...props }: RadioGroupProps) {
  return <RadioPrimitive.Root className={cn('grid gap-3', className)} {...props}>{options.map((option) => <label key={option.value} className="inline-flex items-center gap-2 text-sm text-ink">
    <RadioPrimitive.Item value={option.value} disabled={option.disabled} className="grid size-5 place-items-center rounded-full border border-border bg-surface text-primary-strong focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"><RadioPrimitive.Indicator><Circle aria-hidden="true" className="fill-current" size={9} /></RadioPrimitive.Indicator></RadioPrimitive.Item>{option.label}
  </label>)}</RadioPrimitive.Root>;
}

export type SwitchProps = Omit<SwitchPrimitive.SwitchProps, 'asChild'>;
export function Switch({ className, ...props }: SwitchProps) {
  return <SwitchPrimitive.Root dir="ltr" className={cn('relative h-6 w-11 rounded-full bg-border transition-colors data-[state=checked]:bg-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2', className)} {...props}><SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" /></SwitchPrimitive.Root>;
}




