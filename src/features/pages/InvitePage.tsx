import { useEffect, useMemo, useState } from 'react';
import { cloneElement, type ReactElement } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/fields';
import { ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { PasswordStrength } from '@/features/auth/PasswordStrength';
import { passwordSchema } from '@/schemas/auth';
import { inviteService } from '@/services/authFlows.service';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import type { InviteDetails } from '@/services/authFlows.types';
import { ApiError } from '@/api/client';

const invitationSchema = (required: string) => z.object({
  fullName: z.string().trim().min(1, required).max(120),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: 'passwordMismatch' });
type InvitationValues = z.infer<ReturnType<typeof invitationSchema>>;

export default function InvitePage() {
  const { token = '' } = useParams();
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const { notify } = useToast();
  const [status, setStatus] = useState<'loading' | 'invalid' | 'valid' | 'error'>('loading');
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const schema = useMemo(() => invitationSchema(t('auth:required')), [t]);
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm<InvitationValues>({ resolver: zodResolver(schema), defaultValues: { fullName: '', password: '', confirmPassword: '' } });
  const password = watch('password', '');
  useDocumentTitle(t('auth:inviteTitle'));

  useEffect(() => {
    let active = true;
    setStatus('loading');
    void inviteService.validate(token).then((result) => {
      if (!active) return;
      setInvite(result);
      setStatus(result ? 'valid' : 'invalid');
    }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [token, validationAttempt]);

  const submit = handleSubmit(async (values) => {
    if (!invite) return;
    try {
      await inviteService.accept({ token, email: invite.email, fullName: values.fullName, password: values.password });
      notify({ title: t('auth:inviteSuccess'), tone: 'success' });
      navigate('/', { replace: true, state: { email: invite.email } });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setStatus('invalid');
      else if (error instanceof ApiError) for (const [field, message] of Object.entries(error.fieldErrors)) {
        const target = field === 'name' ? 'fullName' : field;
        if (target === 'fullName' || target === 'password') setError(target, { type: 'server', message });
      }
    }
  });

  if (status === 'loading') return <div className="grid gap-5" role="status" aria-label={t('auth:inviteLoading')}><Skeleton variant="title" /><Skeleton variant="text" /><Skeleton variant="card" /></div>;
  if (status === 'error') return <ErrorState title="حصلت مشكلة في التحقق من الدعوة، جرّب تاني." onRetry={() => setValidationAttempt((attempt) => attempt + 1)} />;
  if (status === 'invalid') return <div className="grid gap-5"><h1 className="font-display text-3xl font-bold text-ink">{t('auth:inviteInvalidTitle')}</h1><ErrorState title={t('auth:inviteInvalidTitle')} description={t('auth:inviteInvalidDescription')} /><Link to="/" className="text-sm font-semibold text-primary-strong underline">{t('auth:backToLogin')}</Link></div>;

  return <div className="grid gap-6">
    <header className="grid gap-2"><h1 className="font-display text-3xl font-bold text-ink">{t('auth:inviteTitle')}</h1><p className="text-sm text-muted">{t('auth:inviteDescription')}</p></header>
    <div className="grid gap-1.5"><label htmlFor="invite-email" className="text-sm font-semibold text-ink">{t('auth:email')}</label><Input id="invite-email" type="email" value={invite?.email ?? ''} readOnly aria-readonly="true" className="bg-canvas" /></div>
    <form onSubmit={submit} noValidate className="grid gap-5">
      <Field id="invite-name" label={t('auth:fullName')} error={errors.fullName?.message ? t(`auth:${errors.fullName.message}`) : undefined}><Input id="invite-name" autoComplete="name" aria-invalid={Boolean(errors.fullName)} {...register('fullName')} /></Field>
      <Field id="invite-password" label={t('auth:password')} error={errors.password?.message ? t(`auth:${errors.password.message}`) : undefined}><PasswordInput id="invite-password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register('password')} /></Field>
      <PasswordStrength password={password} />
      <Field id="invite-confirm" label={t('auth:confirmPassword')} error={errors.confirmPassword?.message ? t(`auth:${errors.confirmPassword.message}`) : undefined}><PasswordInput id="invite-confirm" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} {...register('confirmPassword')} /></Field>
      <Button type="submit" loading={isSubmitting} className="w-full">{t('auth:inviteSubmit')}</Button>
    </form>
  </div>;
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactElement<{ 'aria-describedby'?: string }> }) {
  const errorId = `${id}-error`;
  return <div className="grid gap-1.5"><label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>{cloneElement(children, { 'aria-describedby': error ? errorId : undefined })}{error && <p id={errorId} role="alert" className="text-sm text-danger">{error}</p>}</div>;
}
