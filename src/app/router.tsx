import { Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import { RouteSkeleton } from '@/components/ui/feedback';
import { RequireAuth, RequireRole } from '@/app/AuthContext';
import { DashboardLayout } from '@/features/dashboard/layout/DashboardLayout';
import { PublicLayout } from '@/features/public/layout/PublicLayout';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { arabicCoursePath } from '@/lib/courseLinks';

const HomePage = lazy(() => import('@/features/pages/HomePage'));
const CoursesPage = lazy(() => import('@/features/pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('@/features/pages/CourseDetailPage'));
const RegistrationConfirmationPage = lazy(
  () => import('@/features/pages/RegistrationConfirmationPage'),
);
const PrivacyPage = lazy(() => import('@/features/pages/PrivacyPage'));
const TermsPage = lazy(() => import('@/features/pages/TermsPage'));
const LoginPage = lazy(() => import('@/features/pages/LoginPage'));
const InvitePage = lazy(() => import('@/features/pages/InvitePage'));
const ForgotPasswordPage = lazy(() => import('@/features/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/pages/ResetPasswordPage'));
const AdminPage = lazy(() => import('@/features/pages/AdminPage'));
const AssistantPage = lazy(() => import('@/features/pages/AssistantPage'));
const NotFoundPage = lazy(() => import('@/features/pages/NotFoundPage'));
const NotAuthorizedPage = lazy(() => import('@/features/pages/NotAuthorizedPage'));

function RootRedirect() {
  return <Navigate to="/ar" replace />;
}
function CourseLinkRedirect() {
  const location = useLocation();
  const target = arabicCoursePath(location.pathname, location.search, location.hash) ?? '/ar/courses';
  return <Navigate to={target} replace />;
}
function LanguageRoute() {
  const { lang = '' } = useParams();
  const location = useLocation();
  const suffix = location.pathname.replace(/^\/[^/]+/, '');
  if (lang === 'admin') return <AdminArea />;
  if (lang === 'assistant') return <AssistantArea />;
  if (lang === 'en') return <Navigate to={`/ar${suffix}${location.search}${location.hash}`} replace />;
  if (lang !== 'ar') return <NotFoundPage />;
  return <Outlet />;
}
function AdminArea() {
  return (
    <RequireAuth>
      <RequireRole roles={['admin']}>
        <DashboardLayout area="admin">
          <AdminPage />
        </DashboardLayout>
      </RequireRole>
    </RequireAuth>
  );
}
function AssistantArea() {
  return (
    <RequireAuth>
      <RequireRole roles={['assistant', 'admin']}>
        <DashboardLayout area="assistant">
          <AssistantPage />
        </DashboardLayout>
      </RequireRole>
    </RequireAuth>
  );
}
function RouteTree() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteSkeleton />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/courses/:slug" element={<CourseLinkRedirect />} />
          <Route path="/:lang" element={<LanguageRoute />}>
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="courses/:slug" element={<CourseDetailPage />} />
              <Route
                path="register-confirmation/:reference"
                element={<RegistrationConfirmationPage />}
              />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="invite/:token" element={<InvitePage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password/:token" element={<ResetPasswordPage />} />
            </Route>
            <Route path="not-authorized" element={<NotAuthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/not-authorized" element={<NotAuthorizedPage />} />
          <Route path="/admin/*" element={<AdminArea />} />
          <Route path="/assistant/*" element={<AssistantArea />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
export function AppRouter() {
  return (
    <BrowserRouter>
      <RouteTree />
    </BrowserRouter>
  );
}
