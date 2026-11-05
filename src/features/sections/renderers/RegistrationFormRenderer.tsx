import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { Input, Textarea } from '@/components/ui/fields';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { buildSubmissionSchema, type SubmissionValues } from '@/lib/formSchema';
import { useCoursePage } from '../CoursePageContext';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
import { getRegistrationAttribution } from '@/lib/attribution';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { RegistrationSuccessCard } from '@/features/sections/RegistrationSuccessCard';
const empty: SubmissionValues = { fullName: '', email: '', phone: '', consent: false as never };
function createIdempotencyKey(): string {
  try {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    if (typeof crypto.getRandomValues === 'function') {
      return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // A timestamp/random fallback is only an idempotency identifier, not a secret.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
export default function RegistrationFormRenderer({ section, registrationTarget = false }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('registration');
  const { course, formDefinition, settings, mode } = useCoursePage();
  const inert = mode !== 'public';
  const schema = useMemo(() => buildSubmissionSchema(formDefinition), [formDefinition]);
  const idempotencyKey = useRef<string | null>(null);
  const submissionIdempotencyKey = idempotencyKey.current ?? createIdempotencyKey();
  idempotencyKey.current = submissionIdempotencyKey;
  const formStartedAt = useRef(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ reference: string; name: string; title: string } | null>(null);
  const form = useForm<SubmissionValues>({
    resolver: zodResolver(schema) as unknown as Resolver<SubmissionValues>,
    defaultValues: {
      ...empty,
      ...Object.fromEntries(
        formDefinition.fields.map((field) => [field.id, field.type === 'checkbox' ? false : '']),
      ),
    },
    shouldFocusError: true,
  });
  const label = (value: { ar: string; en: string }) => getBilingualText(value, language);
  const submit = form.handleSubmit(async (values) => {
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      // The API treats submissions under two seconds as automated. Keep the
      // timestamp tied to the first visible form render and make the wait visible.
      const remainingBotCheckTime = 2000 - (Date.now() - formStartedAt.current);
      if (remainingBotCheckTime > 0) await new Promise((resolve) => window.setTimeout(resolve, remainingBotCheckTime));
      const { registrationsService } = await import('@/services/registrations');
      const extendedValues = values as SubmissionValues & { honeypot?: string };
      const answers = Object.fromEntries(
        formDefinition.fields.map((field) => [field.id, extendedValues[field.id]]),
      ) as Record<string, string | boolean | undefined>;
      const reference = await registrationsService.submit({
        courseSlug: course.slug,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        answers,
        consent: Boolean(values.consent),
        idempotencyKey: submissionIdempotencyKey,
        honeypot: String(extendedValues.honeypot ?? ''),
        formStartedAt: formStartedAt.current,
        attribution: getRegistrationAttribution(),
      });
      if (!reference.reference) throw new Error('Missing registration reference');
      setSuccess({ reference: reference.reference, name: String(values.fullName ?? ''), title: getBilingualText(course.title, language) });
    } catch (cause) {
      const { RegistrationServiceError } = await import('@/services/registrations.types');
      if (cause instanceof RegistrationServiceError) {
        for (const [field, message] of Object.entries(cause.fieldErrors)) form.setError(field as keyof SubmissionValues, { type: 'server', message });
        setError(cause.message);
        if (import.meta.env.DEV) console.error('[Registration] request failed', { code: cause.code, requestId: cause.requestId });
      } else {
        if (import.meta.env.DEV) console.error('[Registration] unexpected submit failure', { errorType: cause instanceof Error ? cause.name : 'unknown' });
        setError(t('submitError'));
      }
    } finally {
      setSubmitting(false);
    }
  }, (invalidFields) => {
    const names = Object.keys(invalidFields);
    setError(t('validationSummary'));
    if (import.meta.env.DEV) console.error('[Registration] validation blocked', { fields: names });
    const first = names[0];
    if (first) {
      const inputId = `field-${first.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
      const focusFirstInvalid = () => {
        const input = document.getElementById(inputId);
        input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input?.focus();
      };
      if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(focusFirstInvalid);
      else window.setTimeout(focusFirstInvalid, 0);
    }
  });
  if (section.type !== 'registrationForm') return null;
  if (success) {
    return <SectionFrame settings={section.settings} id={registrationTarget ? 'register' : `register-${section.id}`} registrationTarget={registrationTarget}>
      <RegistrationSuccessCard
        reference={success.reference}
        name={success.name}
        courseTitle={success.title}
        whatsappNumber={settings.whatsappNumber}
        messageTemplate={settings.registrationWhatsappTemplate}
        onCopy={() => { void navigator.clipboard?.writeText(success.reference).catch(() => undefined); }}
      />
    </SectionFrame>;
  }
  if (!course.registrationOpen) {
    const inquiry = buildWhatsAppLink({
      phone: course.whatsappNumberOverride || settings.whatsappNumber,
      message: t('inquiryMessage', { courseTitle: label(course.title) }),
    });
    return (
      <SectionFrame settings={section.settings} id={registrationTarget ? 'register' : `register-${section.id}`} registrationTarget={registrationTarget}>
        <section className="mx-auto grid max-w-3xl gap-4 rounded-md border border-border bg-surface p-6">
          <SectionHeading title={section.content.title} language={language} />
          <p>{t('closed')}</p>
          {inquiry && (
            <a
              href={inquiry}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-xs bg-primary-strong ps-5 pe-5 font-semibold text-white"
            >
              {t('inquiry')}
            </a>
          )}
        </section>
      </SectionFrame>
    );
  }
  return (
    <SectionFrame settings={section.settings} id={registrationTarget ? 'register' : `register-${section.id}`} registrationTarget={registrationTarget}>
      <section className="mx-auto grid max-w-3xl gap-5 rounded-md border border-border bg-surface section-card-padding shadow-soft">
        <SectionHeading title={section.content.title} language={language} />
        {section.content.subtitle && (
          <p className="text-muted">{label(section.content.subtitle)}</p>
        )}
        <form className="grid gap-4" onSubmit={inert ? (event) => event.preventDefault() : submit} noValidate>
          <FormField
            name="fullName"
            control={form.control}
            label={t('fullName')}
            render={(field, state) => (
              <Input
                {...form.register('fullName')}
                id={field.id}
                disabled={inert}
                autoComplete="name"
                aria-invalid={state.invalid}
                aria-describedby={field['aria-describedby']}
              />
            )}
          />
          <FormField
            name="email"
            control={form.control}
            label={t('email')}
            render={(field, state) => (
              <Input
                {...form.register('email')}
                id={field.id}
                disabled={inert}
                type="email"
                autoComplete="email"
                aria-invalid={state.invalid}
                aria-describedby={field['aria-describedby']}
              />
            )}
          />
          <FormField
            name="phone"
            control={form.control}
            label={t('phone')}
            render={(field, state) => (
              <Input
                {...form.register('phone')}
                id={field.id}
                disabled={inert}
                type="tel"
                inputMode="tel"
                dir="ltr"
                autoComplete="tel"
                aria-invalid={state.invalid}
                aria-describedby={field['aria-describedby']}
              />
            )}
          />
          {formDefinition.fields.map((fieldDefinition) => {
            const fieldName = fieldDefinition.id as keyof SubmissionValues;
            return (
              <FormField
                key={fieldDefinition.id}
                name={fieldName}
                control={form.control}
                label={fieldDefinition.type === 'checkbox' ? '' : label(fieldDefinition.label)}
                hint={fieldDefinition.helpText ? label(fieldDefinition.helpText) : undefined}
                render={(field, state) => {
                  const props = {
                    ...form.register(fieldDefinition.id as keyof SubmissionValues),
                    id: field.id,
                    'aria-invalid': state.invalid,
                    'aria-describedby': field['aria-describedby'],
                  };
                  if (fieldDefinition.type === 'textarea')
                    return <Textarea {...props} maxLength={fieldDefinition.maxLength} />;
                  if (fieldDefinition.type === 'select')
                    return (
                      <Select
                        id={field.id}
                        disabled={inert}
                        value={String(form.watch(fieldDefinition.id) ?? '')}
                        onValueChange={(value) =>
                          form.setValue(fieldDefinition.id as keyof SubmissionValues, value)
                        }
                        options={(fieldDefinition.options ?? []).map((option) => ({
                          value: option.value,
                          label: label(option.label),
                        }))}
                        placeholder={t('selectOption')}
                        aria-invalid={state.invalid}
                        aria-describedby={field['aria-describedby']}
                      />
                    );
                  if (fieldDefinition.type === 'radio')
                    return (
                      <div className="grid gap-2">
                        {(fieldDefinition.options ?? []).map((option) => (
                          <label key={option.value} className="flex min-h-11 items-center gap-2">
                          <input type="radio" value={option.value} disabled={inert} {...props} />
                            {label(option.label)}
                          </label>
                        ))}
                      </div>
                    );
                  if (fieldDefinition.type === 'checkbox')
                    return (
                      <label className="flex min-h-11 items-center gap-2">
                        <input type="checkbox" disabled={inert} {...props} />
                        <span>{label(fieldDefinition.label)}</span>
                      </label>
                    );
                  return (
                    <Input
                      {...props}
                      disabled={inert}
                      type="text"
                      placeholder={
                        fieldDefinition.placeholder ? label(fieldDefinition.placeholder) : undefined
                      }
                      maxLength={fieldDefinition.maxLength}
                    />
                  );
                }}
              />
            );
          })}
          <FormField
            name={'consent' as keyof SubmissionValues}
            control={form.control}
            label=""
            render={(field, state) => (
              <label className="flex min-h-11 items-center gap-2">
                <input
                  id={field.id}
                  type="checkbox"
                  disabled={inert}
                  {...form.register('consent')}
                  aria-invalid={state.invalid}
                  aria-describedby={field['aria-describedby']}
                />
                <span>
                  {formDefinition.consentText?.ar ?? t('consent')}{' '}
                  {settings.privacyUrl && <a href={settings.privacyUrl} className="text-primary-strong underline">سياسة الخصوصية</a>}
                </span>
              </label>
            )}
          />
          <div aria-hidden="true" className="absolute size-px overflow-hidden">
            <label htmlFor="registration-honeypot">اترك الحقل ده فاضي</label>
            <input
              id="registration-honeypot"
              tabIndex={-1}
              autoComplete="off"
              {...form.register('honeypot' as keyof SubmissionValues)}
            />
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <Button type="submit" disabled={submitting || inert}>
            {submitting ? t('submitting') : t('submit')}
          </Button>
          <p className="text-sm text-muted">{t('offlinePayment')}</p>
        </form>
      </section>
    </SectionFrame>
  );
}
