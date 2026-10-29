import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import type { CtaLink } from '@/schemas/sections';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useCoursePage } from './CoursePageContext';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { SectionModeContext } from './SectionModeContext';

export function CtaLinkButton({
  cta,
  variant = 'primary',
}: {
  cta: CtaLink;
  variant?: 'primary' | 'secondary';
}) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  const { course, settings } = useCoursePage();
  const mode = useContext(SectionModeContext);
  const label = getBilingualText(cta.label, language);
  const cls =
    variant === 'primary'
      ? 'inline-flex min-h-11 items-center justify-center rounded-xs bg-primary-strong ps-5 pe-5 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'
      : 'inline-flex min-h-11 items-center justify-center rounded-xs border border-border ps-5 pe-5 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';
  if (mode === 'builder') return <span className={`${cls} cursor-not-allowed opacity-70`} aria-disabled="true">{label}</span>;
  if (cta.destination.kind === 'link') {
    const href = cta.destination.href;
    if (/^https?:/i.test(href))
      return (
        <a className={cls} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    if (href.startsWith('/'))
      return (
        <Link className={cls} to={href}>
          {label}
        </Link>
      );
    return (
      <a className={cls} href={href}>
        {label}
      </a>
    );
  }
  const action = cta.destination.action;
  if (action === 'scrollToRegister')
    return (
      <button
        type="button"
        className={cls}
        onClick={() =>
          document
            .getElementById('register')
            ?.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'auto'
                : 'smooth',
              block: 'start',
            })
        }
      >
        {label}
      </button>
    );
  if (action === 'call') {
    const phone = settings.phone.replace(/[^+\d]/g, '');
    return phone ? (
      <a className={cls} href={`tel:${phone}`}>
        {label}
      </a>
    ) : (
      <button type="button" className={cls} disabled title={t('contactUnavailable')}>
        {label}
      </button>
    );
  }
  const title = getBilingualText(course.title, language);
  const message = t('whatsappMessage', { courseTitle: title });
  const href = buildWhatsAppLink({ phone: settings.whatsappNumber, message });
  return href ? (
    <a className={cls} href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  ) : (
    <button type="button" className={cls} disabled title={t('contactUnavailable')}>
      {label}
    </button>
  );
}
