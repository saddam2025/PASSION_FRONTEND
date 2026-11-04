import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '@/services/admin.service';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useSeo } from '@/lib/useSeo';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import type { BilingualText } from '@/schemas';

interface PrivacySection { heading: BilingualText; paragraphs: BilingualText[] }

type LegalKind = 'privacyPolicy' | 'terms';
function isLegalSections(value: unknown): value is PrivacySection[] {
  return (
    Array.isArray(value) &&
    value.every(
      (section) =>
        typeof section === 'object' &&
        section !== null &&
        'heading' in section &&
        'paragraphs' in section &&
        Array.isArray(section.paragraphs),
    )
  );
}

export function LegalPage({ kind }: { kind: LegalKind }) {
  const [data, setData] = useState<PrivacySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { language } = useLanguage();
  const { t } = useTranslation(kind === 'terms' ? 'terms' : 'privacy');
  useSeo({ title: t('title'), description: t('description'), language });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    void adminService.publicSettings().then(
      (settings) => {
        const legal = settings.values.legal;
        const registration = settings.values.registration;
        const privacyText = kind === 'privacyPolicy' && typeof registration === 'object' && registration !== null
          ? (registration as { privacyPolicy?: { ar?: unknown } }).privacyPolicy?.ar
          : undefined;
        const configured =
          typeof legal === 'object' && legal !== null && kind in legal
            ? (legal as Record<string, unknown>)[kind]
            : undefined;
        const legalPage = configured && typeof configured === 'object' ? configured as { body?: unknown; title?: unknown } : undefined;
        const bodyText = typeof legalPage?.body === 'string' ? legalPage.body : legalPage?.body && typeof legalPage.body === 'object' && 'ar' in legalPage.body ? String((legalPage.body as { ar: unknown }).ar ?? '') : '';
        const titleText = typeof legalPage?.title === 'string' ? legalPage.title : legalPage?.title && typeof legalPage.title === 'object' && 'ar' in legalPage.title ? String((legalPage.title as { ar: unknown }).ar ?? '') : '';
        const sections = kind === 'privacyPolicy' && typeof privacyText === 'string' && privacyText.trim()
          ? [{ heading: { ar: '', en: '' }, paragraphs: [{ ar: privacyText.trim(), en: '' }] }]
          : bodyText.trim()
          ? [{ heading: { ar: titleText, en: '' }, paragraphs: [{ ar: bodyText.trim(), en: '' }] }]
          : isLegalSections(configured)
          ? configured
          : [];
        if (active) setData(sections);
      },
    ).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
    };
  }, [kind, attempt]);

  if (loading) return <main className="mx-auto grid w-full max-w-4xl gap-4 ps-container pe-container py-section" aria-label="جاري تحميل الصفحة"><Skeleton variant="title" /><Skeleton variant="text" /><Skeleton variant="card" /></main>;
  if (error) return <main className="mx-auto w-full max-w-4xl ps-container pe-container py-section"><ErrorState title="حصلت مشكلة في تحميل الصفحة، جرّب تاني." onRetry={() => setAttempt((value) => value + 1)} /></main>;

  return (
    <article className="mx-auto grid w-full max-w-4xl gap-8 ps-container pe-container py-section">
      <header>
        <h1 className="text-4xl font-bold">{t('title')}</h1>
        <p className="mt-3 text-muted">{t('draft')}</p>
      </header>
      {data.length ? (
        data.map((section, i) => (
          <section key={i} className="grid gap-3">
            <h2 className="text-xl font-bold">{getBilingualText(section.heading, language)}</h2>
            {section.paragraphs.map((paragraph, j) => (
              <p key={j} className="leading-relaxed text-muted">
                {getBilingualText(paragraph, language)}
              </p>
            ))}
          </section>
        ))
      ) : (
        <p role="status" className="text-muted">{t('notConfigured')}</p>
      )}
    </article>
  );
}
