import { Component, type PropsWithChildren, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@/components/ui/feedback';

interface ErrorBoundaryState { hasError: boolean }
function ErrorFallback() {
  const { t } = useTranslation('errors');
  return <main className="mx-auto max-w-5xl ps-container pe-container py-section"><ErrorState title={t('generic')} description={t('genericDescription')} /></main>;
}
export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): ErrorBoundaryState { return { hasError: true }; }
  render(): ReactNode { return this.state.hasError ? <ErrorFallback /> : this.props.children; }
}

