import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { MediaLibraryDialog } from '@/features/builder/media/MediaLibraryDialog';
import type { MediaAsset } from '@/services/media';
import { mediaUrl } from '@/lib/mediaUrl';
import { permissionCatalog } from '@/schemas/permissions';
import { settingsObject, type SettingsSection } from './settingsConfig';

type Field = {
  key: string;
  kind?: 'text' | 'url' | 'email' | 'phone' | 'image' | 'textarea' | 'switch' | 'select';
  localized?: boolean;
  options?: string[];
};
const fields: Partial<Record<SettingsSection, Field[]>> = {
  academy: [
    { key: 'name', localized: true },
    { key: 'tagline', localized: true },
    { key: 'logo', kind: 'image' },
    { key: 'favicon', kind: 'image' },
  ],
  contact: [
    { key: 'whatsappNumber', kind: 'phone' },
    { key: 'defaultCountryCode' },
    { key: 'phone', kind: 'phone' },
    { key: 'email', kind: 'email' },
    { key: 'address', localized: true },
    { key: 'mapLink', kind: 'url' },
    { key: 'openingHours', localized: true },
  ],
  social: ['facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'x'].map((key) => ({
    key,
    kind: 'url',
  })),
  messaging: [
    { key: 'registrationMessage', localized: true, kind: 'textarea' },
    { key: 'greeting', localized: true, kind: 'textarea' },
  ],
  registration: [
    { key: 'privacyUrl', kind: 'url' },
    { key: 'confirmationNote', localized: true, kind: 'textarea' },
  ],
  payments: [
    { key: 'defaultCurrency', kind: 'select', options: ['EGP', 'USD', 'SAR', 'AED', 'EUR'] },
    { key: 'instructions', localized: true, kind: 'textarea' },
  ],
  seo: [
    { key: 'titleTemplate' },
    { key: 'description', localized: true, kind: 'textarea' },
    { key: 'ogImage', kind: 'image' },
    { key: 'allowSearchEngines', kind: 'switch' },
  ],
  permissions: [{ key: 'assistantsCanSeePaymentDetails', kind: 'switch' }],
};
function Input({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.kind === 'switch')
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  if (field.kind === 'select')
    return (
      <select
        className="min-h-11 rounded-xs border border-border bg-surface px-3"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      >
        {field.options?.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    );
  const common = {
    className: 'min-h-11 w-full rounded-xs border border-border bg-surface px-3',
    value: String(value ?? ''),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
  };
  return field.kind === 'textarea' ? (
    <textarea {...common} rows={3} />
  ) : (
    <input
      {...common}
      lang={field.kind === 'email' || field.kind === 'url' || field.kind === 'phone' ? undefined : 'ar'}
      dir={field.kind === 'email' || field.kind === 'url' || field.kind === 'phone' ? 'ltr' : 'rtl'}
      type={
        field.kind === 'email'
          ? 'email'
          : field.kind === 'url'
            ? 'url'
            : field.kind === 'phone'
              ? 'tel'
              : 'text'
      }
    />
  );
}
function ImageField({
  value,
  onChange,
  label,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('builder');
  const src = typeof value === 'string' ? value : '';
  return (
    <div className="grid gap-2">
      <span className="text-sm text-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {src && (
          <img
            src={mediaUrl(src)}
            alt=""
            width={96}
            height={64}
            className="size-16 rounded-xs border border-border object-contain"
          />
        )}
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          {t('builder:chooseImage')}
        </Button>
      </div>
      <MediaLibraryDialog
        open={open}
        onOpenChange={setOpen}
        onChoose={(asset: MediaAsset) => {
          onChange(asset.key);
          setOpen(false);
        }}
      />
    </div>
  );
}
export function SettingsSectionEditor({
  section,
  value,
  onChange,
}: {
  section: SettingsSection;
  value: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const { t } = useTranslation(['settings', 'users', 'builder']);
  const setObject = (key: string, child: string, next: unknown) =>
    onChange(key, { ...settingsObject(value[key]), [child]: next });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(fields[section] ?? []).map((field) => {
        if (section === 'permissions' && field.key === 'assistantsCanSeePaymentDetails')
          return (
            <div key={field.key} className="grid gap-2 sm:col-span-2">
              <label className="flex min-h-11 items-center gap-3">
                <Input
                  field={{ ...field, kind: 'switch' }}
                  value={value[field.key]}
                  onChange={(next) => onChange(field.key, next)}
                />
                {t(`fields.${field.key}`)}
              </label>
              <p className="font-semibold">{t('defaultAssistantPermissions')}</p>
              {Object.keys(permissionCatalog).map((permission) => {
                const selected = Array.isArray(value.defaultPermissions)
                  ? (value.defaultPermissions as string[])
                  : [];
                return (
                  <label key={permission} className="flex min-h-12 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(permission)}
                      onChange={(e) =>
                        onChange(
                          'defaultPermissions',
                          e.target.checked
                            ? [...selected, permission]
                            : selected.filter((item) => item !== permission),
                        )
                      }
                    />
                    <span className="grid">
                      <strong>
                {t(`users:permissions.${permission}`, { defaultValue: permission })}
                      </strong>
                      <small className="text-muted">
                        {t(`users:permissions.${permission}Description`)}
                      </small>
                    </span>
                  </label>
                );
              })}
            </div>
          );
        const label = t(`fields.${field.key}`, { defaultValue: field.key });
        if (field.kind === 'image')
          return (
            <fieldset key={field.key} className="grid gap-2">
              <legend className="text-sm font-semibold">{label}</legend>
              <ImageField
                label={label}
                value={value[field.key]}
                onChange={(next) => onChange(field.key, next)}
              />
            </fieldset>
          );
        const localized = settingsObject(value[field.key]);
        return (
          <fieldset key={field.key} className="grid gap-2">
            <legend className="text-sm font-semibold">{label}</legend>
            <label className="grid gap-1 text-sm">
                <Input
                  field={field}
                  value={field.localized ? localized.ar : value[field.key]}
                  onChange={(next) => field.localized ? setObject(field.key, 'ar', next) : onChange(field.key, next)}
                />
              </label>
          </fieldset>
        );
      })}
      {section === 'payments' && <PaymentOptions value={value} onChange={onChange} />}
    </div>
  );
}
function PaymentOptions({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const { t } = useTranslation('settings');
  const currencies = ['EGP', 'USD', 'SAR', 'AED', 'EUR'];
  const methods = ['cash', 'bank_transfer', 'e_wallet', 'instapay', 'other'];
  const enabled = Array.isArray(value.enabledCurrencies)
    ? (value.enabledCurrencies as string[])
    : [];
  const methodState = settingsObject(value.methods);
  return (
    <>
      <fieldset className="grid gap-2">
        <legend className="font-semibold">{t('enabledCurrencies')}</legend>
        {currencies.map((code) => (
          <label key={code} className="flex min-h-10 items-center gap-2">
            <input
              type="checkbox"
              checked={enabled.includes(code)}
              onChange={(e) =>
                onChange(
                  'enabledCurrencies',
                  e.target.checked ? [...enabled, code] : enabled.filter((item) => item !== code),
                )
              }
            />
            {code}
          </label>
        ))}
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="font-semibold">{t('acceptedMethods')}</legend>
        {methods.map((method) => (
          <label key={method} className="flex min-h-10 items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(methodState[method])}
              onChange={(e) => onChange('methods', { ...methodState, [method]: e.target.checked })}
            />
            {t(`paymentMethods.${method}`)}
          </label>
        ))}
      </fieldset>
    </>
  );
}
