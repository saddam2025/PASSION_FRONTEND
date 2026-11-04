import { lazy, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RouteSkeleton } from '@/components/ui/feedback';
import NotFoundPage from './NotFoundPage';

const LeadsPage = lazy(() => import('@/features/leads/LeadsPage'));
const CustomerPage = lazy(() => import('@/features/leads/CustomerPage'));

export default function AssistantPage() {
  const { pathname } = useLocation();
  if (pathname === '/assistant') return <Navigate to="/assistant/registrations" replace />;
  const page = pathname === '/assistant/registrations' ? <LeadsPage />
    : /^\/assistant\/registrations\/[^/]+/.test(pathname) ? <CustomerPage />
      : <NotFoundPage area="assistant" />;
  return <Suspense fallback={<RouteSkeleton />}>{page}</Suspense>;
}
