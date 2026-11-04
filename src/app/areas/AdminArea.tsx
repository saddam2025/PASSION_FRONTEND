import { lazy, Suspense } from 'react';
import { RequireAuth, RequireRole } from '@/app/AuthContext';
import { RouteSkeleton } from '@/components/ui/feedback';
import { DashboardLayout } from '@/features/dashboard/layout/DashboardLayout';

const AdminPage = lazy(() => import('@/features/pages/AdminPage'));

export default function AdminArea() {
  return (
    <RequireAuth>
      <RequireRole roles={['admin']}>
        <DashboardLayout area="admin">
          <Suspense fallback={<RouteSkeleton />}>
            <AdminPage />
          </Suspense>
        </DashboardLayout>
      </RequireRole>
    </RequireAuth>
  );
}
