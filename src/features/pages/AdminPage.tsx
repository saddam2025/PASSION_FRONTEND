import { Navigate, useLocation } from 'react-router-dom';
import CoursesListPage from '@/features/courses/CoursesListPage';
import CourseWorkspacePage from '@/features/courses/CourseWorkspacePage';
import LeadsPage from '@/features/leads/LeadsPage';
import CustomerPage from '@/features/leads/CustomerPage';
import UsersPage from '@/features/admin/UsersPage';
import SettingsPage from '@/features/admin/SettingsPage';
import OverviewPage from '@/features/dashboard/OverviewPage';

export default function AdminPage() {
  const { pathname } = useLocation();
  if (pathname === '/admin') return <OverviewPage />;
  if (pathname === '/admin/courses') return <CoursesListPage />;
  if (pathname === '/admin/courses/new') return <Navigate to="/admin/courses?new=1" replace />;
  if (/^\/admin\/courses\/[^/]+/.test(pathname)) return <CourseWorkspacePage />;
  if (pathname === '/admin/registrations') return <LeadsPage />;
  if (/^\/admin\/registrations\/[^/]+/.test(pathname)) return <CustomerPage />;
  if (pathname === '/admin/users') return <UsersPage />;
  if (pathname === '/admin/settings') return <SettingsPage />;
  return <Navigate to="/admin" replace />;
}
