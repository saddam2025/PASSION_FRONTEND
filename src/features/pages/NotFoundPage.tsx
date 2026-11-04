import { useTranslation } from 'react-i18next';
import { PageTransition } from '@/components/common/motion';
import { Container, Section } from '@/components/ui';
import { useLanguage } from '@/i18n/useLanguage';
import { Link } from 'react-router-dom';
import { useSeo } from '@/lib/useSeo';
export default function NotFoundPage({ area = 'public' }: { area?: 'public' | 'admin' | 'assistant' }) {
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  useSeo({ title: t('notFound'), description: t('notFound'), language, robots: 'noindex,follow' });
  const destination = area === 'admin' ? '/admin' : area === 'assistant' ? '/assistant/registrations' : `/${language}`;
  const label = area === 'admin' ? 'العودة للوحة التحكم' : area === 'assistant' ? 'العودة للتسجيلات' : t('goHome');
  return (
    <PageTransition>
      <Section>
        <Container className="grid justify-items-center gap-4 text-center">
          <p className="font-mono text-sm text-primary-strong">404</p>
          <h1 className="text-3xl font-bold">{t('notFound')}</h1>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xs bg-primary-strong ps-5 pe-5 text-sm font-semibold text-on-primary shadow-soft focus-visible:ring-2 focus-visible:ring-primary"
            to={destination}
          >
            {label}
          </Link>
        </Container>
      </Section>
    </PageTransition>
  );
}
