import { Navigate, useLocation } from 'react-router-dom';
import { DashboardRoutePage } from '@/features/dashboard/layout/DashboardRoutePage';
import CoursesListPage from '@/features/courses/CoursesListPage';
import CourseWorkspacePage from '@/features/courses/CourseWorkspacePage';
import { ReviewDetailPage } from '@/features/review/ReviewPages';
import ReviewQueuePage from '@/features/review/ReviewQueuePage';
import NotificationsPage from '@/features/notifications/NotificationsPage';
import LeadsPage from '@/features/leads/LeadsPage';
import CustomerPage from '@/features/leads/CustomerPage';
import PaymentsPage from '@/features/payments/PaymentsPage';
import UsersPage from '@/features/admin/UsersPage';
import SettingsPage from '@/features/admin/SettingsPage';
import AuditPage from '@/features/admin/AuditPage';
import { lazy, Suspense } from 'react';
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage'));
const OverviewPage = lazy(() => import('@/features/dashboard/OverviewPage'));
export default function AdminPage() {
  const { pathname } = useLocation();
  if (pathname === '/admin/analytics')
    return (
      <Suspense
        fallback={<div role="status" className="min-h-64 animate-pulse rounded-sm bg-border/50" />}
      >
        <AnalyticsPage />
      </Suspense>
    );
  if (pathname === '/admin')
    return (
      <Suspense
        fallback={<div role="status" className="min-h-64 animate-pulse rounded-sm bg-border/50" />}
      >
        <OverviewPage />
      </Suspense>
    );
  if (pathname === '/admin/courses') return <CoursesListPage />;
  if (pathname === '/admin/courses/new') return <Navigate to="/admin/courses?new=1" replace />;
  if (/^\/admin\/courses\/[^/]+/.test(pathname)) return <CourseWorkspacePage />;
  if (pathname === '/admin/review') return <ReviewQueuePage />;
  if (/^\/admin\/review\/[^/]+/.test(pathname)) return <ReviewDetailPage />;
  if (pathname === '/admin/notifications') return <NotificationsPage />;
  if (pathname === '/admin/leads') return <LeadsPage />;
  if (/^\/admin\/leads\/[^/]+/.test(pathname)) return <CustomerPage />;
  if (pathname === '/admin/payments') return <PaymentsPage />;
  if (pathname === '/admin/users') return <UsersPage />;
  if (pathname === '/admin/settings') return <SettingsPage />;
  if (pathname === '/admin/audit') return <AuditPage />;
  return <DashboardRoutePage area="admin" />;
}
