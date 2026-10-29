import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption { value: string; label: string; disabled?: boolean }
export interface SelectProps {
  id?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

export function Select({ id, value, defaultValue, onValueChange, options, placeholder, disabled, ...ariaProps }: SelectProps) {
  return <RadixSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
    <RadixSelect.Trigger id={id} className="inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-sm border border-border bg-surface ps-3.5 pe-3.5 py-2 text-start text-base text-ink shadow-sm focus-visible:border-primary focus-visible:shadow-focus aria-[invalid=true]:border-danger disabled:opacity-60" {...ariaProps}>
      <RadixSelect.Value placeholder={placeholder} /><RadixSelect.Icon><ChevronDown aria-hidden="true" size={16} /></RadixSelect.Icon>
    </RadixSelect.Trigger>
    <RadixSelect.Portal>
      <RadixSelect.Content position="popper" sideOffset={4} className="z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-sm border border-border bg-surface text-ink shadow-elevated">
        <RadixSelect.ScrollUpButton className="flex justify-center py-1"><ChevronUp size={16} /></RadixSelect.ScrollUpButton>
        <RadixSelect.Viewport className="p-1">{options.map((option) => <RadixSelect.Item key={option.value} value={option.value} disabled={option.disabled} className={cn('relative flex cursor-pointer select-none items-center rounded-xs py-2 ps-8 pe-3 text-sm outline-none focus:bg-primary/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50')}>
          <RadixSelect.ItemIndicator className="absolute start-2"><Check aria-hidden="true" size={15} /></RadixSelect.ItemIndicator><RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
        </RadixSelect.Item>)}</RadixSelect.Viewport>
        <RadixSelect.ScrollDownButton className="flex justify-center py-1"><ChevronDown size={16} /></RadixSelect.ScrollDownButton>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  </RadixSelect.Root>;
}



