import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import { AccessibleCarousel } from '@/components/common/AccessibleCarousel';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading, SectionImage } from './SectionContent';
import { RichTextRenderer } from '../RichTextRenderer';
import type { AnyRendererProps } from './types';
import { LazyCourseVideo } from '../LazyCourseVideo';
export default function TestimonialsRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  if (section.type !== 'testimonials') return null;
  const c = section.content;
  const item = (entry: (typeof c.items)[number]) => (
    <figure className="grid gap-3 rounded-md border border-border bg-surface p-6">
      {entry.photo && (
        <SectionImage
          image={entry.photo}
          language={language}
          width={96}
          height={96}
          className="size-16 rounded-full object-cover"
        />
      )}
      {entry.video && c.mode !== 'text' && <LazyCourseVideo video={entry.video} />}
      {entry.quote && c.mode !== 'video' && <blockquote><RichTextRenderer value={entry.quote} /></blockquote>}
      <figcaption className="font-semibold">
        {getBilingualText(entry.authorName, language)}
        {entry.authorRole && (
          <span className="font-normal text-muted">
            {' '}
            · {getBilingualText(entry.authorRole, language)}
          </span>
        )}
      </figcaption>
    </figure>
  );
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <SectionHeading title={c.title} language={language} />
      {c.layout === 'carousel' ? (
        <AccessibleCarousel
          items={c.items}
          language={language}
          label={t('testimonials')}
          previousLabel={t('previous')}
          nextLabel={t('next')}
          positionLabel={(current, total) => t('position', { current, total })}
          renderItem={(entry) => item(entry)}
        />
      ) : (
        <div className="section-columns-2">
          {c.items.map((entry, index) => (
            <div key={index}>{item(entry)}</div>
          ))}
        </div>
      )}
    </SectionFrame>
  );
}
