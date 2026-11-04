import { lazy, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RouteSkeleton } from '@/components/ui/feedback';
import NotFoundPage from './NotFoundPage';

const CoursesListPage = lazy(() => import('@/features/courses/CoursesListPage'));
const CourseWorkspacePage = lazy(() => import('@/features/courses/CourseWorkspacePage'));
const LeadsPage = lazy(() => import('@/features/leads/LeadsPage'));
const CustomerPage = lazy(() => import('@/features/leads/CustomerPage'));
const UsersPage = lazy(() => import('@/features/admin/UsersPage'));
const SettingsPage = lazy(() => import('@/features/admin/SettingsPage'));
const OverviewPage = lazy(() => import('@/features/dashboard/OverviewPage'));

export default function AdminPage() {
  const { pathname } = useLocation();
  if (pathname === '/admin/courses/new') return <Navigate to="/admin/courses?new=1" replace />;
  const page = pathname === '/admin' ? <OverviewPage />
    : pathname === '/admin/courses' ? <CoursesListPage />
      : /^\/admin\/courses\/[^/]+/.test(pathname) ? <CourseWorkspacePage />
        : pathname === '/admin/registrations' ? <LeadsPage />
          : /^\/admin\/registrations\/[^/]+/.test(pathname) ? <CustomerPage />
            : pathname === '/admin/users' ? <UsersPage />
              : pathname === '/admin/settings' ? <SettingsPage />
                : <NotFoundPage area="admin" />;
  return <Suspense fallback={<RouteSkeleton />}>{page}</Suspense>;
}
