import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { FEATURE_FLAGS, type FeatureFlags } from '@/config/features';

const PublicShell = lazy(() => import('./PublicShell'));

export function PublicLayout({ features = FEATURE_FLAGS }: { features?: FeatureFlags }) {
  if (!features.PUBLIC_SHELL_ENABLED) return <Outlet />;
  return <Suspense fallback={null}><PublicShell /></Suspense>;
}
