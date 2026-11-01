import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '@/services/admin.mock';
import { siteContentService } from '@/services/siteContent.mock';
import type { PrivacySection } from '@/services/siteContent';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useSeo } from '@/lib/useSeo';

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
  const { language } = useLanguage();
  const { t } = useTranslation(kind === 'terms' ? 'terms' : 'privacy');
  useSeo({ title: t('title'), description: t('description'), language });

  useEffect(() => {
    let active = true;
    void Promise.all([adminService.publicSettings(), siteContentService.get()]).then(
      ([settings, mockContent]) => {
        const legal = settings.values.legal;
        const registration = settings.values.registration;
        const privacyText = kind === 'privacyPolicy' && typeof registration === 'object' && registration !== null
          ? (registration as { privacyPolicy?: { ar?: unknown } }).privacyPolicy?.ar
          : undefined;
        const configured =
          typeof legal === 'object' && legal !== null && kind in legal
            ? (legal as Record<string, unknown>)[kind]
            : undefined;
        const sections = kind === 'privacyPolicy' && typeof privacyText === 'string' && privacyText.trim()
          ? [{ heading: { ar: '', en: '' }, paragraphs: [{ ar: privacyText.trim(), en: '' }] }]
          : isLegalSections(configured)
          ? configured
          : kind === 'privacyPolicy'
            ? mockContent.privacy
            : [];
        if (active) setData(sections);
      },
    );
    return () => {
      active = false;
    };
  }, [kind]);

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
