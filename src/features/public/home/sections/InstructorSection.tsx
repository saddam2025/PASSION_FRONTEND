import { SmartImage } from '@/components/common/SmartImage';
import { Frame } from './shared';
import { list, text, value, useLanguage } from './content';
import type { HomeSection } from '@/services/siteContent';
export function InstructorSection({ section }: { section: HomeSection }) {
  const { language } = useLanguage();
  const name = text(value(section, 'name'), language),
    bio = text(value(section, 'bio'), language);
  const credentials = list(section, 'credentials')
    .map((x) => text(x, language))
    .filter(Boolean);
  if (!name || !bio) return null;
  return (
    <Frame title={text(value(section, 'title'), language)}>
      <div className="grid items-center gap-6 sm:grid-cols-[12rem_1fr]">
        <SmartImage
          slot="instructor-portrait"
          alt={name}
          width={240}
          height={300}
          className="rounded-md"
        />
        <div>
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="text-muted">{text(value(section, 'role'), language)}</p>
          <p className="mt-4">{bio}</p>
          {credentials.length > 0 && (
            <ul className="mt-3 list-inside list-disc text-sm">
              {credentials.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Frame>
  );
}
