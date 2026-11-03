import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { MediaLibraryDialog } from '@/features/builder/media/MediaLibraryDialog';
import type { MediaAsset } from '@/services/media';
import { mediaUrl } from '@/lib/mediaUrl';
import { settingsObject, type SettingsSection } from './settingsConfig';

type Field = { key: string; kind?: 'text' | 'url' | 'email' | 'phone' | 'image' | 'textarea' | 'switch'; localized?: boolean };
const fields: Partial<Record<SettingsSection, Field[]>> = {
  academy: [{ key: 'name', localized: true }, { key: 'logo', kind: 'image' }],
  contact: [{ key: 'whatsappNumber', kind: 'phone' }, { key: 'phone', kind: 'phone' }, { key: 'email', kind: 'email' }],
  social: ['facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'x'].map((key) => ({ key, kind: 'url' })),
  messaging: [{ key: 'registrationMessage', localized: true, kind: 'textarea' }],
  registration: [{ key: 'privacyUrl', kind: 'url' }, { key: 'privacyPolicy', localized: true, kind: 'textarea' }],
  seo: [{ key: 'titleTemplate' }, { key: 'description', localized: true, kind: 'textarea' }, { key: 'ogImage', kind: 'image' }, { key: 'allowSearchEngines', kind: 'switch' }],
};

function ImageField({ value, onChange, label }: { value: unknown; onChange: (value: unknown) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('builder');
  const src = typeof value === 'string' ? value : '';
  return <div className="grid gap-2"><span className="text-sm text-muted">{label}</span><div className="flex flex-wrap items-center gap-3">{src && <img src={mediaUrl(src)} alt="" width={96} height={64} className="size-16 rounded-xs border border-border object-contain" />}<Button type="button" variant="secondary" onClick={() => setOpen(true)}>{t('chooseImage')}</Button></div><MediaLibraryDialog open={open} onOpenChange={setOpen} onChoose={(asset: MediaAsset) => { onChange(asset.key); setOpen(false); }} /></div>;
}

export function SettingsSectionEditor({ section, value, onChange }: { section: SettingsSection; value: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  const { t } = useTranslation('settings');
  const setArabic = (key: string, next: unknown) => onChange(key, { ...settingsObject(value[key]), ar: next });
  return <div className="grid gap-4 sm:grid-cols-2">{(fields[section] ?? []).map((field) => {
    const label = t(`fields.${field.key}`, { defaultValue: field.key });
    if (field.kind === 'image') return <fieldset key={field.key} className="grid gap-2"><legend className="text-sm font-semibold">{label}</legend><ImageField label={label} value={value[field.key]} onChange={(next) => onChange(field.key, next)} /></fieldset>;
    if (field.kind === 'switch') return <label key={field.key} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={Boolean(value[field.key])} onChange={(event) => onChange(field.key, event.target.checked)} />{label}</label>;
    const localized = settingsObject(value[field.key]);
    const current = field.localized ? String(localized.ar ?? '') : String(value[field.key] ?? '');
    const common = { className: 'min-h-11 w-full rounded-xs border border-border bg-surface px-3', value: current, dir: field.kind === 'email' || field.kind === 'url' || field.kind === 'phone' ? 'ltr' as const : 'rtl' as const, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => field.localized ? setArabic(field.key, event.target.value) : onChange(field.key, event.target.value) };
    return <fieldset key={field.key} className="grid gap-2"><legend className="text-sm font-semibold">{label}</legend><label className="grid gap-1 text-sm">{field.kind === 'textarea' ? <textarea {...common} rows={5} /> : <input {...common} type={field.kind === 'email' ? 'email' : field.kind === 'url' ? 'url' : field.kind === 'phone' ? 'tel' : 'text'} />}</label></fieldset>;
  })}</div>;
}
