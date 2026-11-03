import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/fields';
import { useToast } from '@/components/ui/feedback';
import { useLanguage } from '@/i18n/useLanguage';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { passwordResetService } from '@/services/authFlows.service';

const emailSchema = (message: string) => z.object({ email: z.string().trim().email(message) });
type EmailValues = z.infer<ReturnType<typeof emailSchema>>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const { language } = useLanguage();
  const { notify } = useToast();
  const [sent, setSent] = useState(false);
  const schema = useMemo(() => emailSchema(t('invalidEmail')), [t]);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmailValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } });
  useDocumentTitle(t('forgotTitle'));
  const submit = handleSubmit(async ({ email }) => {
    await passwordResetService.requestReset(email);
    setSent(true);
    notify({ title: t('forgotSuccess'), tone: 'success' });
  });

  return <div className="grid gap-6">
    <header className="grid gap-2"><h1 className="font-display text-3xl font-bold text-ink">{t('forgotTitle')}</h1><p className="text-sm text-muted">{t('forgotDescription')}</p></header>
    {!sent ? <form onSubmit={submit} noValidate className="grid gap-5">
      <div className="grid gap-1.5"><label htmlFor="forgot-email" className="text-sm font-semibold text-ink">{t('email')}</label><Input id="forgot-email" type="email" autoComplete="email" inputMode="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'forgot-email-error' : undefined} {...register('email')} />{errors.email?.message && <p id="forgot-email-error" role="alert" className="text-sm text-danger">{errors.email.message}</p>}</div>
      <Button type="submit" loading={isSubmitting} className="w-full">{t('submit')}</Button>
    </form> : <p role="status" className="rounded-sm border border-success/20 bg-success/5 ps-4 pe-4 py-4 text-sm text-success">{t('forgotSuccess')}</p>}
    <Link to={`/${language}/login`} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-strong underline-offset-4 hover:underline">{t('backToLogin')}</Link>
  </div>;
}
