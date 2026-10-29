import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/fields';
import { ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { PasswordStrength } from '@/features/auth/PasswordStrength';
import { passwordSchema } from '@/schemas/auth';
import { mockPasswordResetService } from '@/services/authFlows.mock';
import { useLanguage } from '@/i18n/useLanguage';
import { useDocumentTitle } from '@/lib/useDocumentTitle';

const resetSchema = z.object({ password: passwordSchema, confirmPassword: z.string() }).refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: 'passwordMismatch' });
type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const { token = '' } = useParams();
  const { language } = useLanguage();
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { notify } = useToast();
  const [status, setStatus] = useState<'loading' | 'invalid' | 'valid'>('loading');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ResetValues>({ resolver: zodResolver(resetSchema), defaultValues: { password: '', confirmPassword: '' } });
  const password = watch('password', '');
  useDocumentTitle(t('resetTitle'));

  useEffect(() => {
    let active = true;
    setStatus('loading');
    void mockPasswordResetService.validateResetToken(token).then((valid) => { if (active) setStatus(valid ? 'valid' : 'invalid'); }).catch(() => { if (active) setStatus('invalid'); });
    return () => { active = false; };
  }, [token]);

  const submit = handleSubmit(async (values) => {
    try {
      await mockPasswordResetService.resetPassword(token, values.password);
      notify({ title: t('resetSuccess'), tone: 'success' });
      navigate(`/${language}/login`, { replace: true });
    } catch { setStatus('invalid'); }
  });

  if (status === 'loading') return <div className="grid gap-5" role="status" aria-label={t('resetLoading')}><Skeleton variant="title" /><Skeleton variant="text" /><Skeleton variant="card" /></div>;
  if (status === 'invalid') return <div className="grid gap-5"><h1 className="font-display text-3xl font-bold text-ink">{t('resetInvalidTitle')}</h1><ErrorState title={t('resetInvalidTitle')} description={t('resetInvalidDescription')} /><Link to={`/${language}/forgot-password`} className="text-sm font-semibold text-primary-strong underline">{t('forgotTitle')}</Link></div>;

  return <div className="grid gap-6"><header className="grid gap-2"><h1 className="font-display text-3xl font-bold text-ink">{t('resetTitle')}</h1></header>
    <form onSubmit={submit} noValidate className="grid gap-5">
      <div className="grid gap-1.5"><label htmlFor="reset-password" className="text-sm font-semibold text-ink">{t('password')}</label><PasswordInput id="reset-password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'reset-password-error' : undefined} {...register('password')} />{errors.password?.message && <p id="reset-password-error" role="alert" className="text-sm text-danger">{t(errors.password.message)}</p>}</div>
      <PasswordStrength password={password} />
      <div className="grid gap-1.5"><label htmlFor="reset-confirm" className="text-sm font-semibold text-ink">{t('confirmPassword')}</label><PasswordInput id="reset-confirm" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'reset-confirm-error' : undefined} {...register('confirmPassword')} />{errors.confirmPassword?.message && <p id="reset-confirm-error" role="alert" className="text-sm text-danger">{t(errors.confirmPassword.message)}</p>}</div>
      <Button type="submit" loading={isSubmitting} className="w-full">{t('submit')}</Button>
    </form>
  </div>;
}
