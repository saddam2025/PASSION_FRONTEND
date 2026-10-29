import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const { t } = useTranslation('courses');
  const Component = multiline ? 'textarea' : 'input';
  const copy = () => onChange({ ...value, [language]: value[language === 'ar' ? 'en' : 'ar'] });
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="min-h-10 rounded-pill border border-border px-3 text-xs"
          onClick={() => setLanguage('ar')}
        >
          {t('arabic')}
          {!value.ar.trim() && (
            <span className="ms-1 text-warning" aria-label={t('missingTranslation')}>
              •
            </span>
          )}
        </button>
        <button
          type="button"
          className="min-h-10 rounded-pill border border-border px-3 text-xs"
          onClick={() => setLanguage('en')}
        >
          {t('english')}
          {!value.en.trim() && (
            <span className="ms-1 text-warning" aria-label={t('missingTranslation')}>
              •
            </span>
          )}
        </button>
        <button
          type="button"
          className="ms-auto min-h-10 px-2 text-xs text-primary-strong underline"
          onClick={copy}
        >
          {t('copyFromOtherLanguage')}
        </button>
      </div>
      <Component
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        disabled={disabled}
        className={`${multiline ? 'min-h-24' : 'min-h-11'} w-full rounded-sm border border-border px-3 py-2 text-start`}
        value={value[language]}
        onChange={(event) => onChange({ ...value, [language]: event.target.value })}
      />
    </fieldset>
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
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const { t } = useTranslation('courses');
  const text = value[language]
    .map((block) => block.children.map((child) => child.text).join(''))
    .join('\n');
  const update = (next: string) =>
    onChange({
      ...value,
      [language]: next
        .split('\n')
        .filter(Boolean)
        .map((paragraph) => ({ type: 'paragraph' as const, children: [{ text: paragraph }] })),
    });
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex gap-2">
        <button
          type="button"
          className="min-h-10 rounded-pill border border-border px-3 text-xs"
          onClick={() => setLanguage('ar')}
        >
          {t('arabic')}
        </button>
        <button
          type="button"
          className="min-h-10 rounded-pill border border-border px-3 text-xs"
          onClick={() => setLanguage('en')}
        >
          {t('english')}
        </button>
      </div>
      <textarea
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        disabled={disabled}
        className="min-h-28 rounded-sm border border-border px-3 py-2 text-start"
        value={text}
        onChange={(event) => update(event.target.value)}
      />
    </fieldset>
  );
}
