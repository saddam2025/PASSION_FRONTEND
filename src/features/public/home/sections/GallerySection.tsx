import { useTranslation } from 'react-i18next';
import { GalleryLightbox } from '@/components/common/GalleryLightbox';
import { Frame } from './shared';
import { list, text, useLanguage } from './content';
import type { HomeSection } from '@/services/siteContent';
export function GallerySection({ section }: { section: HomeSection }) {
  const { language } = useLanguage();
  const { t } = useTranslation('home');
  const items = list(section, 'items') as { src: string; alt: unknown; caption?: unknown }[];
  if (!items.length) return null;
  return (
    <Frame title={text(section.content.title, language)}>
      <GalleryLightbox
        items={items.map((item) => ({
          src: item.src,
          alt: text(item.alt, language),
          caption: item.caption ? text(item.caption, language) : undefined,
        }))}
        title={text(section.content.title, language)}
        language={language}
        previousLabel={t('previous')}
        nextLabel={t('next')}
        closeLabel={t('close')}
        columns={3}
      />
    </Frame>
  );
}
