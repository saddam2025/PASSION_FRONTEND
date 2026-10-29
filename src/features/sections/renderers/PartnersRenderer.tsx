import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading, SectionImage } from './SectionContent';
import type { AnyRendererProps } from './types';
export default function PartnersRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  if (section.type !== 'partners') return null;
  const c = section.content;
  return (
    <SectionFrame settings={section.settings} id={section.settings.anchorId ?? section.id}>
      <SectionHeading title={c.title} language={language} />
      <div className="flex flex-wrap items-center justify-center gap-6">
        {c.logos.map((logo, index) => {
          const image = (
            <SectionImage
              image={logo.image}
              language={language}
              width={320}
              height={160}
              className="h-16 w-40 object-contain"
            />
          );
          return (
            <figure key={index} className="grid justify-items-center gap-2">
              {logo.link ? (
                <a
                  href={logo.link}
                  target={/^https?:/i.test(logo.link) ? '_blank' : undefined}
                  rel={/^https?:/i.test(logo.link) ? 'noopener noreferrer' : undefined}
                >
                  {image}
                </a>
              ) : (
                image
              )}
              <figcaption className="text-sm text-muted">
                {getBilingualText(logo.name, language)}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </SectionFrame>
  );
}
