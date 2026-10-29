import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import { SectionFrame } from '../SectionFrame';
import { GalleryLightbox } from '@/components/common/GalleryLightbox';
import { SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
export default function GalleryRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  if (section.type !== 'gallery') return null;
  const c = section.content;
  const columns = c.layout === 'grid2' ? 2 : c.layout === 'grid3' ? 3 : 4;
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <SectionHeading language={language} />
      <GalleryLightbox
        columns={columns}
        items={c.items.map((item) => ({
          src: item.image.src,
          alt: item.image.decorative
            ? ''
            : getBilingualText(item.image.alt ?? { ar: '', en: '' }, language),
          caption: item.caption ? getBilingualText(item.caption, language) : undefined,
        }))}
        title={t('gallery')}
        language={language}
        previousLabel={t('previous')}
        nextLabel={t('next')}
        closeLabel={t('close')}
      />
    </SectionFrame>
  );
}
