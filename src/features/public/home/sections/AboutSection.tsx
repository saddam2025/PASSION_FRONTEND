import { SmartImage } from '@/components/common/SmartImage';
import { Frame } from './shared';
import { useSectionText, list, text } from './content';
import type { HomeSection } from '@/services/siteContent';
import { useLanguage } from '@/i18n/useLanguage';
export function AboutSection({ section }: { section: HomeSection }) {
  const { language } = useLanguage();
  const { title, body } = useSectionText(section);
  const highlights = list(section, 'highlights')
    .map((x) => text(x, language))
    .filter(Boolean);
  return (
    <Frame id="about" title={title}>
      <div className="grid items-center gap-8 md:grid-cols-2">
        <SmartImage slot="about" alt={title} width={600} height={450} className="rounded-lg" />
        <div className="grid gap-4">
          <p className="text-lg text-muted">{body}</p>
          {highlights.length > 0 && (
            <ul className="grid gap-2">
              {highlights.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Frame>
  );
}
