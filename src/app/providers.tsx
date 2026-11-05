import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type PropsWithChildren } from 'react';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { ToastProvider, TooltipProvider } from '@/components/ui';
import { SplashScreen } from '@/components/common/SplashScreen';
import NetworkBackground from '@/components/common/NetworkBackground';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { appQueryClient } from '@/app/queryClient';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => appQueryClient);
  return <LanguageProvider><QueryClientProvider client={queryClient}><ToastProvider><TooltipProvider><ErrorBoundary><NetworkBackground />{children}<SplashScreen /></ErrorBoundary></TooltipProvider></ToastProvider></QueryClientProvider></LanguageProvider>;
}

