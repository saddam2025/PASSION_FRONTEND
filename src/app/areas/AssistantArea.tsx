import { lazy, Suspense } from 'react';
import { RequireAuth, RequireRole } from '@/app/AuthContext';
import { LoadingSplash } from '@/components/common/LoadingSplash';
import { DashboardLayout } from '@/features/dashboard/layout/DashboardLayout';

const AssistantPage = lazy(() => import('@/features/pages/AssistantPage'));

export default function AssistantArea() {
  return (
    <RequireAuth>
      <RequireRole roles={['assistant', 'admin']}>
        <DashboardLayout area="assistant">
          <Suspense fallback={<LoadingSplash />}>
            <AssistantPage />
          </Suspense>
        </DashboardLayout>
      </RequireRole>
    </RequireAuth>
  );
}
