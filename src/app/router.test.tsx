// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/app/AuthContext';
import { FEATURE_FLAGS, type FeatureFlags } from '@/config/features';
import { RouteTree } from './router';

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getPublishedBySlug: vi.fn(),
}));

vi.mock('@/services/auth.api', () => ({
  apiAuthService: { getCurrentUser: mocks.getCurrentUser, login: vi.fn(), logout: vi.fn() },
}));
vi.mock('@/services/courses', () => ({ publicCoursesService: { getPublishedBySlug: mocks.getPublishedBySlug } }));
vi.mock('@/services/usePublicSettings', () => ({
  usePublicSettings: () => ({ academyName: { ar: 'الأكاديمية', en: '' }, logo: '', whatsappNumber: '', description: { ar: '', en: '' } }),
}));
vi.mock('@/components/common/SmartImage', () => ({ SmartImage: () => null }));
vi.mock('@/features/sections/PageRenderer', () => ({ PageRenderer: () => <div>محتوى صفحة الكورس</div> }));
vi.mock('@/lib/useSeo', () => ({ useSeo: vi.fn() }));
vi.mock('@/i18n/useLanguage', () => ({
  useLanguage: () => ({ language: 'ar' }),
  getBilingualText: (value: { ar?: string } | string | null | undefined) => typeof value === 'string' ? value : value?.ar ?? '',
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => ({ notAvailable: 'الكورس ده مش متاح حاليًا', notAvailableHint: 'الرابط ده مش متاح حاليًا.' }[key] ?? key) }),
}));
vi.mock('@/features/auth/AuthLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return { AuthLayout: ({ children }: { children?: ReactNode }) => <div>{children ?? <Outlet />}</div> };
});
vi.mock('@/features/dashboard/layout/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@/features/public/layout/PublicShell', () => ({ default: () => <div>public-shell</div> }));
vi.mock('@/features/pages/LoginPage', () => ({ default: () => <p>staff-login-screen</p> }));
vi.mock('@/features/pages/HomePage', () => ({ default: () => <p>restored-home-screen</p> }));
vi.mock('@/features/pages/CoursesPage', () => ({ default: () => <p>restored-catalog-screen</p> }));
vi.mock('@/features/pages/RegistrationConfirmationPage', () => ({ default: () => <p>confirmation-screen</p> }));
vi.mock('@/features/pages/InvitePage', () => ({ default: () => <p>invite-screen</p> }));
vi.mock('@/features/pages/ForgotPasswordPage', () => ({ default: () => <p>forgot-password-screen</p> }));
vi.mock('@/features/pages/ResetPasswordPage', () => ({ default: () => <p>reset-password-screen</p> }));
vi.mock('@/features/pages/PrivacyPage', () => ({ default: () => <p>privacy-screen</p> }));
vi.mock('@/features/pages/TermsPage', () => ({ default: () => <p>terms-screen</p> }));
vi.mock('@/features/pages/NotAuthorizedPage', () => ({ default: () => <p>not-authorized-screen</p> }));
vi.mock('@/features/pages/AdminPage', () => ({ default: () => <p>admin-screen</p> }));
vi.mock('@/features/pages/AssistantPage', () => ({ default: () => <p>assistant-screen</p> }));

function LocationText() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}{location.hash}</output>;
}

function sessionFetch(user: { id: string; email: string; role: 'admin' | 'assistant'; name: { ar: string } } | null) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/auth/me') && user) return new Response(JSON.stringify({ user }), { status: 200 });
    return new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED' } }), { status: 401 });
  });
  vi.stubGlobal('fetch', fetchMock);
  mocks.getCurrentUser.mockImplementation(async () => {
    const response = await fetch('/api/v1/auth/me', { credentials: 'include' });
    return response.ok ? (await response.json()).user : null;
  });
  return fetchMock;
}

function renderAt(path: string, features: FeatureFlags = FEATURE_FLAGS) {
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><RouteTree features={features} /><LocationText /></AuthProvider></MemoryRouter>);
}

const course = {
  id: 'course-1', slug: 'sample-course', title: { ar: 'كورس تجريبي', en: '' }, shortDescription: { ar: 'وصف', en: '' },
  coverImage: { src: '' }, price: 2000, promoPrice: null, currency: 'EGP', startDate: '', registrationOpen: true,
  accreditationVerified: false, instructor: null, delivery: '', schedule: '', accreditation: '', whatsappNumber: '', whatsappUrl: '',
  whatsappMessageTemplate: { ar: '', en: '' }, pageConfig: { sections: [] }, formDefinition: { fields: [] },
};

describe('public and staff route policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPublishedBySlug.mockResolvedValue({ status: 'ok', course });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('shows staff login at / and calls the session endpoint once when there is no session', async () => {
    const fetchMock = sessionFetch(null);
    renderAt('/');
    expect(await screen.findByText('staff-login-screen')).toBeTruthy();
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/me'))).toHaveLength(1);
  });

  it('routes an existing Admin session from / to the overview', async () => {
    const fetchMock = sessionFetch({ id: 'admin-1', email: 'admin@example.test', role: 'admin', name: { ar: 'مدير' } });
    renderAt('/');
    expect(await screen.findByText('admin-screen')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('routes an existing Assistant session from / to registrations', async () => {
    const fetchMock = sessionFetch({ id: 'assistant-1', email: 'assistant@example.test', role: 'assistant', name: { ar: 'مساعد' } });
    renderAt('/');
    expect(await screen.findByText('assistant-screen')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(['/ar', '/ar/', '/login', '/ar/courses', '/ar/register-confirmation/ABC', '/ar/about', '/unknown/path'])('%s resolves to the staff entry when public pages are disabled', async (path) => {
    sessionFetch(null);
    renderAt(path);
    expect(await screen.findByText('staff-login-screen')).toBeTruthy();
  });

  it('keeps a published landing page route working without auth or refresh calls', async () => {
    const fetchMock = sessionFetch(null);
    renderAt('/ar/courses/sample-course');
    expect(await screen.findByText('محتوى صفحة الكورس')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
  });

  it('renders an unavailable course message without a catalog or other link', async () => {
    sessionFetch(null);
    mocks.getPublishedBySlug.mockResolvedValue({ status: 'notFound' });
    renderAt('/ar/courses/unavailable');
    expect(await screen.findByText('الكورس ده مش متاح حاليًا')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('preserves query and hash while redirecting English course paths to Arabic', async () => {
    sessionFetch(null);
    renderAt('/en/courses/sample-course?campaign=one#register');
    await screen.findByText('محتوى صفحة الكورس');
    expect(screen.getByTestId('location').textContent).toBe('/ar/courses/sample-course?campaign=one#register');
  });

  it('restores the home and catalog through their feature flags', async () => {
    const features = { ...FEATURE_FLAGS, PUBLIC_HOME_ENABLED: true, PUBLIC_CATALOG_ENABLED: true };
    const fetchMock = sessionFetch(null);
    renderAt('/ar', features);
    expect(await screen.findByText('restored-home-screen')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    cleanup();
    sessionFetch(null);
    renderAt('/ar/courses', features);
    expect(await screen.findByText('restored-catalog-screen')).toBeTruthy();
  });

  it.each([
    ['/ar/privacy', 'privacy-screen'], ['/ar/terms', 'terms-screen'], ['/ar/invite/token', 'invite-screen'],
    ['/ar/forgot-password', 'forgot-password-screen'], ['/ar/reset-password/token', 'reset-password-screen'],
  ])('keeps the supported route %s available without a session check', async (path, marker) => {
    const fetchMock = sessionFetch(null);
    renderAt(path);
    expect(await screen.findByText(marker)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks an Assistant from an Admin route', async () => {
    sessionFetch({ id: 'assistant-1', email: 'assistant@example.test', role: 'assistant', name: { ar: 'مساعد' } });
    renderAt('/admin');
    expect(await screen.findByText('not-authorized-screen')).toBeTruthy();
    expect(screen.queryByText('admin-screen')).toBeNull();
  });

  it('preserves the original query and hash when redirecting a legacy /courses/:slug link', async () => {
    sessionFetch(null);
    renderAt('/courses/sample-course?ref=post#register');
    await screen.findByText('محتوى صفحة الكورس');
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/ar/courses/sample-course?ref=post#register'));
  });
});
