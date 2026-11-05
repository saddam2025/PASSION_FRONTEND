import { Controller, type Control, type ControllerFieldState, type ControllerRenderProps, type FieldPath, type FieldValues } from 'react-hook-form';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface FormFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label: string;
  hint?: string;
  className?: string;
  render: (field: ControllerRenderProps<T, FieldPath<T>> & { id: string; 'aria-describedby'?: string; 'aria-invalid': boolean }, state: ControllerFieldState) => ReactNode;
}

export function FormField<T extends FieldValues>({ name, control, label, hint, className, render }: FormFieldProps<T>) {
  const id = `field-${String(name).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const hintId = hint ? `${id}-hint` : undefined;
  return <Controller name={name} control={control} render={({ field, fieldState }) => {
    const errorId = fieldState.error ? `${id}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
    return <div className={cn('grid gap-1.5', className)}>
      {label && <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>}
      {render({ ...field, id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(fieldState.error) }, fieldState)}
      {hint && <p id={hintId} className="text-sm text-muted">{hint}</p>}
      {fieldState.error?.message && <p id={errorId} role="alert" className="text-sm text-danger">{fieldState.error.message}</p>}
    </div>;
  }} />;
}


