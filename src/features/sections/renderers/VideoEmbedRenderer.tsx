import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';
import { LazyCourseVideo } from '../LazyCourseVideo';
export default function VideoEmbedRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'videoEmbed') return null;
  const c = section.content;
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <SectionHeading title={c.title} language={language} />
      <div className="mx-auto max-w-5xl"><LazyCourseVideo video={c.video} /></div>
      {c.caption && (
        <p className="mx-auto mt-3 max-w-5xl text-sm text-muted">
          {getBilingualText(c.caption, language)}
        </p>
      )}
    </SectionFrame>
  );
}
