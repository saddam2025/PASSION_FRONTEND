import { useTranslation } from 'react-i18next';
import { SmartImage } from '@/components/common/SmartImage';
import { Frame } from './shared';
import { list, text, useLanguage } from './content';
import type { HomeSection } from '@/services/siteContent';

function safeLink(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function AccreditationSection({ section }: { section: HomeSection }) {
  const { language } = useLanguage();
  const { t } = useTranslation('home');
  const items = list(section, 'items') as {
    name: unknown;
    description: unknown;
    logo?: string;
    link?: string;
    sample?: boolean;
  }[];
  if (!items.length) return null;
  return (
    <Frame title={text(section.content.title, language)}>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item, index) => {
          const name = text(item.name, language);
          const link = safeLink(item.link);
          return (
            <article key={index} className="rounded-md border border-border p-5">
              {item.logo && (
                <SmartImage
                  slot="partner-1"
                  srcOverride={item.logo}
                  alt={name}
                  width={160}
                  height={80}
                  className="mb-4 h-16 object-contain"
                />
              )}
              <h3 className="font-bold">{name}</h3>
              <p className="mt-2 text-sm text-muted">{text(item.description, language)}</p>
              {item.sample && <p className="mt-2 text-warning">{t('sampleOnly')}</p>}
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center text-primary-strong underline"
                >
                  {t('learnMore')}
                </a>
              )}
            </article>
          );
        })}
      </div>
    </Frame>
  );
}
