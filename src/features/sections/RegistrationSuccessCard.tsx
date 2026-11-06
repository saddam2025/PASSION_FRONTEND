import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { buildRegistrationMessage } from '@/lib/registrationWhatsApp';

export interface RegistrationSuccessCardProps {
  reference: string | null | undefined;
  name?: string;
  courseTitle: string;
  whatsappNumber: string;
  messageTemplate?: string;
  status?: 'received';
  onCopy?: () => void | Promise<void>;
}

export function RegistrationSuccessCard({
  reference,
  name = '',
  courseTitle,
  whatsappNumber,
  messageTemplate,
  status,
  onCopy,
}: RegistrationSuccessCardProps) {
  const { t } = useTranslation('registration');
  const cardRef = useRef<HTMLElement>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof cardRef.current?.scrollIntoView === 'function') {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    cardRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => () => {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
  }, []);

  if (!reference) return null;

  const template = messageTemplate?.trim() || t('whatsappConfirmation');
  const personalizedTemplate = name ? template : template.replace(/أهلاً\s*\{name\}[،,]?\s*/i, '');
  const message = buildRegistrationMessage(personalizedTemplate, name, courseTitle, reference);
  const whatsappHref = whatsappNumber ? buildWhatsAppLink({ phone: whatsappNumber, message }) : null;
  const copyReference = async () => {
    try {
      if (onCopy) await onCopy();
      else await navigator.clipboard.writeText(reference);
      setCopied(true);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      ref={cardRef}
      role="status"
      tabIndex={-1}
      aria-labelledby="registration-success-title"
      className="mx-auto grid max-w-3xl gap-4 rounded-md border border-success/30 bg-surface p-6 shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <h2 id="registration-success-title" className="text-2xl font-bold text-ink">
        {t('provisionalTitle')}
      </h2>
      <p>{t('provisionalInstruction')}</p>
      <div className="flex flex-wrap items-center gap-3 rounded-sm bg-canvas p-3">
        <strong>{t('referenceLabel')}:</strong>
        <span className="font-mono text-lg font-bold text-ink" dir="ltr">{reference}</span>
        <Button
          type="button"
          variant="outline"
          onClick={() => { void copyReference(); }}
        >
          {copied ? t('copiedReference') : t('copyReference')}
        </Button>
      </div>
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-xs bg-primary-strong px-5 font-semibold text-white"
        >
          {t('continueWhatsApp')}
        </a>
      )}
      {!whatsappHref && <p className="text-sm text-muted">{t('whatsappNumberMissing')}</p>}
      {status && <p className="text-sm text-muted">{t('statusReceived')}</p>}
    </section>
  );
}
