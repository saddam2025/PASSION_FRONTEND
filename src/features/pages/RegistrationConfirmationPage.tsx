import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ErrorState, Spinner } from '@/components/ui/feedback';
import { registrationsService } from '@/services/registrations';
import type { PublicRegistrationConfirmation } from '@/services/registrations.types';
import { useToast } from '@/components/ui/feedback';
import { useSeo } from '@/lib/useSeo';
import { usePublicSettings } from '@/services/usePublicSettings';
import { RegistrationSuccessCard } from '@/features/sections/RegistrationSuccessCard';
export default function RegistrationConfirmationPage() {
  const { reference = '' } = useParams();
  const [data, setData] = useState<PublicRegistrationConfirmation | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const { t } = useTranslation('confirmation');
  const toast = useToast();
  const settings = usePublicSettings();
  useSeo({
    title: t('title'),
    description: t('description'),
    robots: 'noindex,nofollow',
  });
  useEffect(() => {
    let live = true;
    setData(undefined);
    setLoadError(false);
    void registrationsService
      .getConfirmation(reference)
      .then((x) => live && setData(x))
      .catch(() => live && setLoadError(true));
    return () => {
      live = false;
    };
  }, [reference, loadAttempt]);
  const title = data?.courseTitle.ar ?? '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      toast.notify({ title: t('copied'), tone: 'success' });
    } catch {
      toast.notify({ title: t('copyError'), tone: 'warning' });
    }
  };
  return (
    <main className="mx-auto grid min-h-[65vh] w-full max-w-3xl content-center gap-5 ps-container pe-container py-section">
      {loadError ? (
        <ErrorState title="حصلت مشكلة في تحميل تأكيد التسجيل، جرّب تاني." onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />
      ) : data === undefined ? (
        <Spinner label={t('loading')} />
      ) : data === null ? (
        <section className="rounded-md border border-border bg-surface p-8">
          <h1 className="text-3xl font-bold">{t('notFoundTitle')}</h1>
          <p className="mt-3 text-muted">{t('notFound')}</p>
        </section>
      ) : (
        <RegistrationSuccessCard
          reference={data.reference}
          courseTitle={title}
          whatsappNumber={settings.whatsappNumber}
          messageTemplate={settings.registrationWhatsappTemplate}
          status={data.status}
          onCopy={() => void copy()}
        />
      )}
    </main>
  );
}
