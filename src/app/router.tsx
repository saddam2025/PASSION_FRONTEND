import { Suspense, lazy } from 'react';
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
import { PublicLayout } from '@/features/public/layout/PublicLayout';
import { LandingLayout } from '@/features/public/layout/LandingLayout';
import { LegalLayout } from '@/features/public/layout/LegalLayout';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { arabicCoursePath } from '@/lib/courseLinks';
import { AuthProvider, useAuth } from '@/app/AuthContext';
import { FEATURE_FLAGS, type FeatureFlags } from '@/config/features';

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
const AdminArea = lazy(() => import('@/app/areas/AdminArea'));
const AssistantArea = lazy(() => import('@/app/areas/AssistantArea'));
const NotAuthorizedPage = lazy(() => import('@/features/pages/NotAuthorizedPage'));

function StaffEntry() {
  const { user, loading } = useAuth();
  if (loading) return <RouteSkeleton />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/assistant/registrations'} replace />;
  return <AuthLayout><LoginPage /></AuthLayout>;
}
function CourseLinkRedirect() {
  const location = useLocation();
  const target = arabicCoursePath(location.pathname, location.search, location.hash) ?? '/';
  return <Navigate to={target} replace />;
}
function LoginRedirect() {
  const location = useLocation();
  return <Navigate to={`/${location.search}${location.hash}`} replace />;
}
function LanguageRoute() {
  const { lang = '' } = useParams();
  const location = useLocation();
  const suffix = location.pathname.replace(/^\/[^/]+/, '');
  if (lang === 'en') return <Navigate to={`/ar${suffix}${location.search}${location.hash}`} replace />;
  if (lang !== 'ar') return <Navigate to="/" replace />;
  return <Outlet />;
}
export function RouteTree({ features = FEATURE_FLAGS }: { features?: FeatureFlags } = {}) {
  const location = useLocation();
  return (
      <Suspense fallback={<RouteSkeleton />}>
        <Routes location={location}>
          <Route path="/" element={<StaffEntry />} />
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/courses/:slug" element={<CourseLinkRedirect />} />
          <Route path="/:lang/*" element={<LanguageRoute />}>
            {features.PUBLIC_HOME_ENABLED
              ? <Route element={<PublicLayout features={features} />}><Route index element={<HomePage />} /></Route>
              : <Route index element={<StaffEntry />} />}
            {features.PUBLIC_CATALOG_ENABLED && <Route element={<PublicLayout features={features} />}><Route path="courses" element={<CoursesPage />} /></Route>}
            <Route path="courses/:slug" element={<LandingLayout />}><Route index element={<CourseDetailPage />} /></Route>
            {features.PUBLIC_CONFIRMATION_PAGE_ENABLED && <Route element={<PublicLayout features={features} />}><Route path="register-confirmation/:reference" element={<RegistrationConfirmationPage />} /></Route>}
            <Route element={<LegalLayout />}>
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="invite/:token" element={<InvitePage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password/:token" element={<ResetPasswordPage />} />
            </Route>
            <Route path="login" element={<LoginRedirect />} />
            <Route path="not-authorized" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          <Route path="/not-authorized" element={<NotAuthorizedPage />} />
          <Route path="/admin/*" element={<AdminArea />} />
          <Route path="/assistant/*" element={<AssistantArea />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
  );
}
export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider><RouteTree /></AuthProvider>
    </BrowserRouter>
  );
}
