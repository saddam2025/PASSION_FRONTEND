import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import { SectionFrame } from '../SectionFrame';
import { RichTextRenderer } from '../RichTextRenderer';
import { useCoursePage } from '../CoursePageContext';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
export default function ContactWhatsAppRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  const { course, settings } = useCoursePage();
  if (section.type !== 'contactWhatsApp') return null;
  const c = section.content;
  const courseTitle = getBilingualText(course.title, language);
  const fallback = t('whatsappMessage', { courseTitle });
  const message = c.prefilledMessage
    ? getBilingualText(c.prefilledMessage, language).replaceAll('{{courseTitle}}', courseTitle)
    : fallback;
  const wa = c.show.whatsapp
    ? buildWhatsAppLink({ phone: settings.whatsappNumber, message })
    : null;
  const phone = c.show.phone ? settings.phone.replace(/[^+\d]/g, '') : '';
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <article className="grid gap-4 rounded-md border border-border bg-surface p-6">
        <SectionHeading title={c.title} language={language} />
        {c.text && <RichTextRenderer value={c.text} />}
        <div className="flex flex-wrap gap-3">
          {c.show.whatsapp && wa && (
            <a
              className="inline-flex min-h-11 items-center rounded-xs bg-primary-strong ps-5 pe-5 font-semibold text-white"
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('whatsapp')}
            </a>
          )}
          {c.show.phone && phone && (
            <a
              className="inline-flex min-h-11 items-center rounded-xs border border-border ps-5 pe-5"
              href={`tel:${phone}`}
            >
              {t('call')}
            </a>
          )}
          {c.show.email && settings.email && (
            <a
              className="inline-flex min-h-11 items-center rounded-xs border border-border ps-5 pe-5"
              href={`mailto:${settings.email}`}
            >
              {t('email')}
            </a>
          )}
          {c.show.whatsapp && !wa && (
            <p className="text-sm text-muted">{t('contactUnavailable')}</p>
          )}
        </div>
      </article>
    </SectionFrame>
  );
}
