import { Frame } from './shared';
import { list, text, useSectionText } from './content';
import { useLanguage } from '@/i18n/useLanguage';
import type { HomeSection } from '@/services/siteContent';
export function HowItWorksSection({ section }: { section: HomeSection }) {
  const { language } = useLanguage();
  const { title } = useSectionText(section);
  const steps = list(section, 'steps')
    .map((x) => text(x, language))
    .filter(Boolean);
  if (!steps.length) return null;
  return (
    <Frame title={title}>
      <ol className="grid gap-4 md:grid-cols-5">
        {steps.map((step, i) => (
          <li key={i} className="rounded-md border border-border bg-surface p-5">
            <span className="mb-3 grid size-9 place-items-center rounded-full bg-primary-strong font-bold text-white">
              {i + 1}
            </span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
    </Frame>
  );
}
