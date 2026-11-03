import { readFile } from 'node:fs/promises';
const read = async (path) => readFile(new URL(path, import.meta.url), 'utf8');
const [nav, router, admin, assistant, workspace] = await Promise.all([
  read('../src/features/dashboard/nav.config.ts'), read('../src/app/router.tsx'),
  read('../src/features/pages/AdminPage.tsx'), read('../src/features/pages/AssistantPage.tsx'),
  read('../src/features/courses/CourseWorkspacePage.tsx'),
]);
const errors = [];
const paths = [...nav.matchAll(/path:\s*'([^']+)'/g)].map(([, path]) => path);
const expected = ['/admin', '/admin/courses', '/admin/registrations', '/admin/users', '/admin/settings', '/assistant/registrations'];
if (JSON.stringify(paths) !== JSON.stringify(expected)) errors.push(`Dashboard routes differ from Scope V1: ${paths.join(', ')}`);
if (!router.includes('path="/admin/*"') || !router.includes('path="/assistant/*"')) errors.push('Admin/Assistant shells are not registered.');
for (const [path, source] of [['/admin', admin], ['/assistant/registrations', assistant]]) if (!source.includes(path)) errors.push(`${path} has no dispatcher entry.`);
if (!admin.includes("pathname === '/admin/courses'") || !admin.includes('/^\\/admin\\/courses\\/[^/]+/')) errors.push('Admin course list/detail routes are missing.');
if (!admin.includes("pathname === '/admin/registrations'") || !admin.includes('/^\\/admin\\/registrations\\/[^/]+/')) errors.push('Admin registration list/detail routes are missing.');
if (!assistant.includes("pathname === '/assistant/registrations'") || !assistant.includes('/^\\/assistant\\/registrations\\/[^/]+/')) errors.push('Assistant registration list/detail routes are missing.');
if (!workspace.includes('<CourseWorkspacePage') && !admin.includes('CourseWorkspacePage')) errors.push('Course studio route is not dispatched.');
if (assistant.includes('CoursesListPage') || assistant.includes('CourseWorkspacePage') || assistant.includes('SettingsPage') || assistant.includes('UsersPage')) errors.push('Assistant dispatcher references restricted screens.');
if (nav.includes("'/admin/review'") || nav.includes("'/admin/analytics'") || nav.includes("'/assistant/courses'")) errors.push('A removed dashboard route remains in navigation.');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Scope V1 route check passed (${expected.length} dashboard routes; course and registration detail routes registered).`);
