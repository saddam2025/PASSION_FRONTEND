import { readFile } from 'node:fs/promises';

const read = async (path) => readFile(new URL(path, import.meta.url), 'utf8');
const [router, flags, auth, api, renderer, nav, admin, assistant, workspace] = await Promise.all([
  read('../src/app/router.tsx'), read('../src/config/features.ts'), read('../src/app/AuthContext.tsx'),
  read('../src/api/client.ts'), read('../src/features/sections/renderers/RegistrationFormRenderer.tsx'),
  read('../src/features/dashboard/nav.config.ts'), read('../src/features/pages/AdminPage.tsx'),
  read('../src/features/pages/AssistantPage.tsx'), read('../src/features/courses/CourseWorkspacePage.tsx'),
]);
const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

const dashboardPaths = [...nav.matchAll(/path:\s*'([^']+)'/g)].map(([, path]) => path);
const expectedDashboardPaths = ['/admin', '/admin/courses', '/admin/registrations', '/admin/users', '/admin/settings', '/assistant/registrations'];
expect(JSON.stringify(dashboardPaths) === JSON.stringify(expectedDashboardPaths), `Dashboard routes differ from Scope V1: ${dashboardPaths.join(', ')}`);
expect(router.includes('path="/"') && router.includes('<StaffEntry />'), 'Root staff entry route is missing.');
expect(router.includes('path="/:lang/*"') && router.includes("lang === 'en'"), 'Localized routes or English-to-Arabic redirect are missing.');
expect(router.includes('path="courses/:slug" element={<LandingLayout />}'), 'Public course landing route is missing.');
expect(router.includes('path="/courses/:slug" element={<CourseLinkRedirect />}'), 'Legacy course-link redirect is missing.');
expect(router.includes('PUBLIC_HOME_ENABLED') && router.includes('PUBLIC_CATALOG_ENABLED') && router.includes('PUBLIC_CONFIRMATION_PAGE_ENABLED'), 'Public route feature flags are not applied.');
expect(flags.includes('PUBLIC_HOME_ENABLED: false') && flags.includes('PUBLIC_CATALOG_ENABLED: false') && flags.includes('PUBLIC_SHELL_ENABLED: false') && flags.includes('PUBLIC_CONFIRMATION_PAGE_ENABLED: false'), 'Disabled public features must default to false.');
expect(router.includes('path="privacy"') && router.includes('path="terms"'), 'Privacy and terms routes must stay registered.');
expect(router.includes('path="invite/:token"') && router.includes('path="forgot-password"') && router.includes('path="reset-password/:token"'), 'Invite and password-reset routes are missing.');
expect(router.includes('path="/admin/*"') && router.includes('path="/assistant/*"'), 'Admin/Assistant shells are not registered.');
expect(auth.includes("pathname === '/' || /^\\/ar\\/?$/.test(pathname)") && auth.includes("/^\\/(admin|assistant)(\\/|$)/.test(pathname)"), 'Session restoration is not scoped to staff-entry and dashboard routes.');
expect(api.includes("pathname.startsWith('public/')") && api.includes("pathname === 'settings/public'"), 'Public API 401 responses may trigger session refresh.');
expect(renderer.includes('href="/ar/privacy"') && renderer.includes('href="/ar/terms"'), 'Consent text must link to the legal pages.');
expect((renderer.match(/href="\/ar\/(?:privacy|terms)"/g) ?? []).length === 2, 'Legal pages must only be linked from registration consent.');

for (const [path, source] of [['/admin', admin], ['/assistant/registrations', assistant]]) expect(source.includes(path), `${path} has no dispatcher entry.`);
expect(admin.includes("pathname === '/admin/courses'") && admin.includes('/^\\/admin\\/courses\\/[^/]+/'), 'Admin course list/detail routes are missing.');
expect(admin.includes("pathname === '/admin/registrations'") && admin.includes('/^\\/admin\\/registrations\\/[^/]+/'), 'Admin registration list/detail routes are missing.');
expect(assistant.includes("pathname === '/assistant/registrations'") && assistant.includes('/^\\/assistant\\/registrations\\/[^/]+/'), 'Assistant registration list/detail routes are missing.');
expect(workspace.includes('<CourseWorkspacePage') || admin.includes('CourseWorkspacePage'), 'Course studio route is not dispatched.');
expect(!assistant.includes('CoursesListPage') && !assistant.includes('CourseWorkspacePage') && !assistant.includes('SettingsPage') && !assistant.includes('UsersPage'), 'Assistant dispatcher references restricted screens.');
expect(!nav.includes("'/admin/review'") && !nav.includes("'/admin/analytics'") && !nav.includes("'/assistant/courses'"), 'A removed dashboard route remains in navigation.');

if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Scope V1 route check passed (staff entry, public course/legal routes, disabled route flags, auth scope, and role navigation).');
