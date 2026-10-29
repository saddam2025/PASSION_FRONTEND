import { useState } from 'react';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import type { ImageRef, VideoEmbed } from '@/schemas/sections';
import { SectionImage } from './renderers/SectionContent';
import { useContext } from 'react';
import { SectionModeContext } from './SectionModeContext';

export function LazyCourseVideo({ video, poster }: { video: VideoEmbed; poster?: ImageRef }) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  const mode = useContext(SectionModeContext);
  const [playing, setPlaying] = useState(false);
  const source = video.provider === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1`
    : `https://player.vimeo.com/video/${video.videoId}?autoplay=1`;
  return <div className="relative aspect-video overflow-hidden rounded-md bg-secondary text-on-secondary">
    {playing ? <iframe className="size-full" src={source} title={getBilingualText(video.title, language)} loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-presentation" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <button type="button" disabled={mode === 'builder'} className="relative grid size-full place-items-center p-5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed" onClick={() => setPlaying(true)}>
      {poster && <SectionImage image={poster} language={language} width={960} height={540} className="absolute inset-0 size-full object-cover" />}
      <span className="absolute inset-0 bg-secondary/55" />
      <span className="relative grid gap-2"><strong>{getBilingualText(video.title, language)}</strong><span className="text-xs">{t('videoPrivacy')}</span><span className="mx-auto rounded-pill bg-primary-strong px-4 py-2 text-sm font-semibold">{t(mode === 'builder' ? 'previewInteractions' : 'videoPlay')}</span></span>
    </button>}
  </div>;
}
