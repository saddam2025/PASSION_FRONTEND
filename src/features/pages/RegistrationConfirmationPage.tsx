import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/feedback';
import { usePublicSettings } from '@/services/usePublicSettings';
import { registrationsService } from '@/services/registrations';
import type { PublicRegistrationConfirmation } from '@/services/registrations.types';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useToast } from '@/components/ui/feedback';
import { useSeo } from '@/lib/useSeo';
export default function RegistrationConfirmationPage() {
  const { reference = '' } = useParams();
  const [data, setData] = useState<PublicRegistrationConfirmation | null | undefined>(undefined);
  const s = usePublicSettings();
  const { language } = useLanguage();
  const { t } = useTranslation('confirmation');
  const toast = useToast();
  useSeo({
    title: t('title'),
    description: t('description'),
    language,
    robots: 'noindex,nofollow',
  });
  useEffect(() => {
    let live = true;
    setData(undefined);
    void registrationsService
      .getConfirmation(reference)
      .then((x) => live && setData(x))
      .catch(() => live && setData(null));
    return () => {
      live = false;
    };
  }, [reference]);
  const title = data && !data.alreadyRegistered ? getBilingualText(data.courseTitle, language) : '';
  const message = data
    ? t('whatsappMessage', {
        firstName: data.firstName,
        courseTitle: title,
        reference: data.reference,
      })
    : '';
  const link =
    data && !data.alreadyRegistered
      ? buildWhatsAppLink({ phone: s.whatsappNumber, message })
      : null;
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
      {data === undefined ? (
        <Spinner label={t('loading')} />
      ) : data === null ? (
        <section className="rounded-md border border-border bg-surface p-8">
          <h1 className="text-3xl font-bold">{t('notFoundTitle')}</h1>
          <p className="mt-3 text-muted">{t('notFound')}</p>
        </section>
      ) : (
        <section className="grid gap-5 rounded-md border border-border bg-surface p-6 sm:ps-10 sm:pe-10">
          <span className="grid size-12 place-items-center rounded-full bg-success/10 text-success">
            <Check aria-hidden="true" />
          </span>
          <h1 className="text-3xl font-bold">{t('successTitle')}</h1>
          <p className="text-muted">
            {data.alreadyRegistered ? t('alreadyRegistered') : t('requestReceived')}
          </p>
          {!data.alreadyRegistered && (
            <p>
              <strong>{t('course')}:</strong> {title}
            </p>
          )}
          {!data.alreadyRegistered && (
            <div className="flex flex-wrap items-center gap-3">
              <strong>{t('reference')}:</strong>
              <code className="rounded bg-canvas ps-3 pe-3 py-2">{data.reference}</code>
              <Button variant="secondary" onClick={() => void copy()}>
                <Copy aria-hidden="true" size={16} />
                {t('copy')}
              </Button>
            </div>
          )}
          {!data.alreadyRegistered && <h2 className="text-xl font-bold">{t('nextTitle')}</h2>}
          {!data.alreadyRegistered && (
            <ol className="grid list-inside list-decimal gap-2 text-muted">
              <li>{t('next1')}</li>
              <li>{t('next2')}</li>
              <li>{t('next3')}</li>
            </ol>
          )}
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-xs bg-primary-strong ps-6 pe-6 font-semibold text-white"
            >
              {t('continue')}
            </a>
          ) : (
            <div>
              <Button disabled>{t('continue')}</Button>
              <p className="mt-2 text-sm text-muted">{t('whatsappMissing')}</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
