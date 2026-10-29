import { Frame } from './shared';
import { list, text, useLanguage } from './content';
import { SafeIcon } from './SafeIcon';
import type { IconName } from '@/schemas/sections';
import type { HomeSection } from '@/services/siteContent';

export function WhyUsSection({ section }: { section: HomeSection }) {
  const { language } = useLanguage();
  const title = text(section.content.title, language);
  const items = list(section, 'items') as {
    icon?: IconName;
    title: unknown;
    text: unknown;
  }[];
  if (!items.length) return null;
  return (
    <Frame title={title}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <article key={index} className="rounded-md border border-border p-6">
            <SafeIcon name={item.icon} />
            <h3 className="mt-3 font-bold">{text(item.title, language)}</h3>
            <p className="mt-2 text-sm text-muted">{text(item.text, language)}</p>
          </article>
        ))}
      </div>
    </Frame>
  );
}
