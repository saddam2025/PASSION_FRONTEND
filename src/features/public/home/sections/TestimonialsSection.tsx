import { useTranslation } from 'react-i18next';
import { AccessibleCarousel } from '@/components/common/AccessibleCarousel';
import { Frame } from './shared';
import { list, text, useLanguage } from './content';
import type { HomeSection } from '@/services/siteContent';
export function TestimonialsSection({ section }: { section: HomeSection }) {
  const { language } = useLanguage();
  const { t } = useTranslation('home');
  const items = list(section, 'items') as {
    quote: unknown;
    author: unknown;
    role?: unknown;
    sample?: boolean;
  }[];
  if (!items.length) return null;
  return (
    <Frame title={text(section.content.title, language)}>
      <div className="mx-auto max-w-3xl">
        <AccessibleCarousel
          items={items}
          language={language}
          label={t('carousel')}
          previousLabel={t('previous')}
          nextLabel={t('next')}
          positionLabel={(current, total) => t('testimonialPosition', { current, total })}
          renderItem={(item) => (
            <figure className="min-h-40 rounded-md border border-border bg-surface p-6">
              <blockquote>{text(item.quote, language)}</blockquote>
              <figcaption className="mt-4 font-semibold">
                {text(item.author, language)}
                {text(item.role, language) ? <> · {text(item.role, language)}</> : null}
              </figcaption>
              {item.sample && <small className="text-warning">{t('sampleOnly')}</small>}
            </figure>
          )}
        />
      </div>
    </Frame>
  );
}
