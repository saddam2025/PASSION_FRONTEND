import { useTranslation } from 'react-i18next';
import { CountUp } from '@/components/common/CountUp';
import { Frame } from './shared';
import { list, text } from './content';
import { useLanguage } from '@/i18n/useLanguage';
import type { HomeSection } from '@/services/siteContent';
import { SafeIcon } from './SafeIcon';
import type { IconName } from '@/schemas/sections';
export function TrustStripSection({ section }: { section: HomeSection }) {
  const { language } = useLanguage();
  const { t } = useTranslation('home');
  const items = (
    list(section, 'items') as {
      label: unknown;
      value: unknown;
      icon?: IconName;
      sample?: boolean;
    }[]
  ).filter((item) => text(item.label, language) && text(item.value, language));
  if (!items.length) return null;
  return (
    <Frame>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-md border border-border bg-surface p-5 text-center">
            <SafeIcon name={item.icon} />
            <strong className="block text-2xl text-primary-strong">
              <CountUp value={text(item.value, language)} language={language} />
            </strong>
            <span className="text-sm text-muted">{text(item.label, language)}</span>
            {item.sample && <small className="block text-warning">{t('sampleOnly')}</small>}
          </div>
        ))}
      </div>
    </Frame>
  );
}
