import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { buildWhatsAppLink } from '@/lib/whatsapp';
import type { AnyRendererProps } from './types';
import { getAttribution } from '@/lib/attribution';
const empty: SubmissionValues = { fullName: '', email: '', phone: '', consent: false as never };
export default function RegistrationFormRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('registration');
  const { course, formDefinition, settings } = useCoursePage();
  const navigate = useNavigate();
  const schema = useMemo(() => buildSubmissionSchema(formDefinition), [formDefinition]);
  const idempotencyKey = useRef<string | null>(null);
  const submissionIdempotencyKey = idempotencyKey.current ?? crypto.randomUUID();
  idempotencyKey.current = submissionIdempotencyKey;
  const renderedAt = useRef(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
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
    setError('');
    setSubmitting(true);
    try {
      const { registrationsService } = await import('@/services/registrations');
      const extendedValues = values as SubmissionValues & { website?: string; renderedAt?: number };
      const answers = Object.fromEntries(
        Object.entries(extendedValues).filter(([key]) => key !== 'website' && key !== 'renderedAt'),
      ) as SubmissionValues;
      const website = extendedValues.website;
      const reference = await registrationsService.submit({
        courseSlug: course.slug,
        answers,
        consent: Boolean(values.consent),
        idempotencyKey: submissionIdempotencyKey,
        honeypot: String(website ?? ''),
        renderedAt: renderedAt.current,
        attribution: getAttribution(),
      });
      navigate(`/${language}/register-confirmation/${reference.reference}`);
    } catch {
      setError(t('submitError'));
    } finally {
      setSubmitting(false);
    }
  });
  if (section.type !== 'registrationForm') return null;
  if (!course.registrationOpen) {
    const inquiry = buildWhatsAppLink({
      phone: settings.whatsappNumber,
      message: t('inquiryMessage', { courseTitle: label(course.title) }),
    });
    return (
      <SectionFrame settings={section.settings} id={section.settings.anchorId ?? 'register'}>
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
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? 'register'}>
      <section className="mx-auto grid max-w-3xl gap-5 rounded-md border border-border bg-surface section-card-padding shadow-soft">
        <SectionHeading title={section.content.title} language={language} />
        {section.content.subtitle && (
          <p className="text-muted">{label(section.content.subtitle)}</p>
        )}
        <form className="grid gap-4" onSubmit={submit} noValidate>
          <FormField
            name="fullName"
            control={form.control}
            label={t('fullName')}
            render={(field, state) => (
              <Input
                {...form.register('fullName')}
                id={field.id}
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
                label={label(fieldDefinition.label)}
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
                            <input type="radio" value={option.value} {...props} />
                            {label(option.label)}
                          </label>
                        ))}
                      </div>
                    );
                  if (fieldDefinition.type === 'checkbox')
                    return (
                      <label className="flex min-h-11 items-center gap-2">
                        <input type="checkbox" {...props} />
                        {label(fieldDefinition.label)}
                      </label>
                    );
                  return (
                    <Input
                      {...props}
                      type={
                        fieldDefinition.type === 'email'
                          ? 'email'
                          : fieldDefinition.type === 'phone'
                            ? 'tel'
                            : 'text'
                      }
                      inputMode={fieldDefinition.type === 'phone' ? 'tel' : undefined}
                      dir={fieldDefinition.type === 'phone' ? 'ltr' : undefined}
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
            label={t('consent')}
            render={(field, state) => (
              <label className="flex min-h-11 items-center gap-2">
                <input
                  id={field.id}
                  type="checkbox"
                  {...form.register('consent')}
                  aria-invalid={state.invalid}
                  aria-describedby={field['aria-describedby']}
                />
                <span>
                  {t('consent')}{' '}
                  <Link to={`/${language}/privacy`} className="text-primary-strong underline">
                    {t('privacy')}
                  </Link>
                  {' · '}
                  <Link to={`/${language}/terms`} className="text-primary-strong underline">
                    {t('terms')}
                  </Link>
                </span>
              </label>
            )}
          />
          <div aria-hidden="true" className="absolute size-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              tabIndex={-1}
              autoComplete="off"
              {...form.register('website' as keyof SubmissionValues)}
            />
          </div>
          <input
            type="hidden"
            {...form.register('renderedAt' as keyof SubmissionValues)}
            value={String(renderedAt.current)}
          />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? t('submitting') : t('submit')}
          </Button>
          <p className="text-sm text-muted">{t('offlinePayment')}</p>
        </form>
      </section>
    </SectionFrame>
  );
}
