import type { BilingualRichText } from '@/schemas/sections';
import type { BilingualText } from '@/schemas';

export function BilingualTextField({
  label,
  value,
  onChange,
  multiline = false,
  disabled = false,
}: {
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  multiline?: boolean;
  disabled?: boolean;
}) {
  const Component = multiline ? 'textarea' : 'input';
  return (
    <label className="grid gap-2" dir="rtl">
      <span className="text-sm font-medium">{label}</span>
      <Component
        lang="ar"
        dir="rtl"
        disabled={disabled}
        className={`${multiline ? 'min-h-24' : 'min-h-11'} w-full rounded-sm border border-border px-3 py-2 text-start`}
        value={value.ar ?? ''}
        onChange={(event) => onChange({ ...value, ar: event.target.value })}
      />
    </label>
  );
}

export function BilingualRichField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: BilingualRichText;
  onChange: (value: BilingualRichText) => void;
  disabled?: boolean;
}) {
  const text = (value.ar ?? [])
    .map((block) => block.children.map((child) => child.text).join(''))
    .join('\n');
  const update = (next: string) =>
    onChange({
      ...value,
      ar: next
        .split('\n')
        .filter(Boolean)
        .map((paragraph) => ({ type: 'paragraph' as const, children: [{ text: paragraph }] })),
    });
  return (
    <label className="grid gap-2" dir="rtl">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        lang="ar"
        dir="rtl"
        disabled={disabled}
        className="min-h-28 rounded-sm border border-border px-3 py-2 text-start"
        value={text}
        onChange={(event) => update(event.target.value)}
      />
    </label>
  );
}
