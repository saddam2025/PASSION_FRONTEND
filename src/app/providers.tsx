import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type PropsWithChildren } from 'react';
import { AuthProvider } from '@/app/AuthContext';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { ToastProvider, TooltipProvider } from '@/components/ui';
import { SplashScreen } from '@/components/common/SplashScreen';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { appQueryClient } from '@/app/queryClient';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => appQueryClient);
  return <LanguageProvider><QueryClientProvider client={queryClient}><ToastProvider><TooltipProvider><AuthProvider><ErrorBoundary>{children}<SplashScreen /></ErrorBoundary></AuthProvider></TooltipProvider></ToastProvider></QueryClientProvider></LanguageProvider>;
}

