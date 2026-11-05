import { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/fields';
import { useToast } from '@/components/ui/feedback';
import { useAuth } from '@/app/AuthContext';
import { useLanguage } from '@/i18n/useLanguage';
import { useDocumentTitle } from '@/lib/useDocumentTitle';
import { ApiError } from '@/api/client';

const loginSchema = (invalidEmail: string, required: string) =>
  z.object({
    email: z.string().trim().email(invalidEmail),
    password: z.string().min(1, required),
  });
type LoginValues = z.infer<ReturnType<typeof loginSchema>>;
interface LoginLocationState {
  from?: { pathname?: string; search?: string; hash?: string };
  email?: string;
}

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const { language } = useLanguage();
  const { login } = useAuth();
  const { notify } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = location.state as LoginLocationState | null;
  const prefilledEmail = state?.email || searchParams.get('email') || '';
  const locked = searchParams.get('locked') === '1';
  const sessionExpired = searchParams.get('sessionExpired') === '1';
  const returnTo = searchParams.get('returnTo');
  const schema = useMemo(() => loginSchema(t('auth:invalidEmail'), t('auth:required')), [t]);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefilledEmail, password: '' },
  });
  useDocumentTitle(t('auth:loginTitle'));
  useEffect(() => {
    if (prefilledEmail) reset({ email: prefilledEmail, password: '' });
  }, [prefilledEmail, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const user = await login(values);
      const requested = state?.from?.pathname;
      const safeRequested =
        requested?.startsWith('/') && !requested.startsWith('//')
          ? `${requested}${state?.from?.search ?? ''}${state?.from?.hash ?? ''}`
          : returnTo?.startsWith('/') && !returnTo.startsWith('//')
            ? returnTo
            : null;
      navigate(safeRequested ?? (user.role === 'admin' ? '/admin' : '/assistant/registrations'), {
        replace: true,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field === 'email' || field === 'password') setError(field, { type: 'server', message });
        }
      }
      notify({ title: t('auth:loginError'), tone: 'danger' });
    }
  });

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="font-display text-3xl font-bold text-ink">{t('auth:loginTitle')}</h1>
        <p className="text-sm text-muted">{t('auth:loginDescription')}</p>
      </header>
      {locked && (
        <div
          role="alert"
          className="flex gap-3 rounded-sm border border-warning/30 bg-warning/5 ps-4 pe-4 py-3 text-sm text-warning"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold">{t('auth:lockedTitle')}</p>
            <p>{t('auth:lockedDescription')}</p>
          </div>
        </div>
      )}
      {sessionExpired && (
        <div
          role="alert"
          className="rounded-sm border border-warning/30 bg-warning/5 ps-4 pe-4 py-3 text-sm text-warning"
        >
          {t('auth:sessionExpired')}
        </div>
      )}
      <p className="rounded-sm bg-canvas ps-4 pe-4 py-3 text-xs text-muted">
        {t('auth:lockedNotice')}
      </p>
      <form onSubmit={submit} noValidate className="grid gap-5">
        <div className="grid gap-1.5">
          <label htmlFor="login-email" className="text-sm font-semibold text-ink">
            {t('auth:email')}
          </label>
          <Input
            id="login-email"
            type="email"
            autoComplete="username"
            inputMode="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            {...register('email')}
          />
          {errors.email?.message && (
            <p id="login-email-error" role="alert" className="text-sm text-danger">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="login-password" className="text-sm font-semibold text-ink">
            {t('auth:password')}
          </label>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            {...register('password')}
          />
          {errors.password?.message && (
            <p id="login-password-error" role="alert" className="text-sm text-danger">
              {errors.password.message}
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <Link
            to={`/${language}/forgot-password`}
            className="min-h-11 inline-flex items-center text-sm font-semibold text-primary-strong underline-offset-4 hover:underline"
          >
            {t('auth:forgotLink')}
          </Link>
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">
          {t('auth:submit')}
        </Button>
      </form>
    </div>
  );
}
