import { Suspense, lazy, useEffect } from 'react';
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
import { useLanguage } from '@/i18n/useLanguage';
import { getPreferredLanguage } from '@/i18n/LanguageProvider';
import { RequireAuth, RequireRole } from '@/app/AuthContext';
import { DashboardLayout } from '@/features/dashboard/layout/DashboardLayout';
import { PublicLayout } from '@/features/public/layout/PublicLayout';
import { AuthLayout } from '@/features/auth/AuthLayout';

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
const UiKitPage = import.meta.env.DEV ? lazy(() => import('@/features/dev/UiKitPage')) : null;
const SectionsPlaygroundPage = import.meta.env.DEV
  ? lazy(() => import('@/features/dev/SectionsPlaygroundPage'))
  : null;

function RootRedirect() {
  return <Navigate to={`/${getPreferredLanguage()}`} replace />;
}
function LanguageRoute() {
  const { lang = '' } = useParams();
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const valid = lang === 'ar' || lang === 'en';
  const suffix = location.pathname.replace(/^\/[^/]+/, '');
  useEffect(() => {
    if (valid && language !== lang) setLanguage(lang as 'ar' | 'en');
  }, [lang, language, setLanguage, valid]);
  if (!valid) return <Navigate to={`/ar${suffix}`} replace />;
  if (language !== lang) return <RouteSkeleton />;
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
          {UiKitPage && <Route path="/dev/ui-kit" element={<UiKitPage />} />}
          {SectionsPlaygroundPage && (
            <Route path="/dev/sections" element={<SectionsPlaygroundPage />} />
          )}
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
