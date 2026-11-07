const routeImports: Record<string, () => Promise<unknown>> = {
  '/admin': () => import('@/features/dashboard/OverviewPage'),
  '/admin/courses': () => import('@/features/courses/CoursesListPage'),
  '/admin/registrations': () => import('@/features/leads/LeadsPage'),
  '/admin/users': () => import('@/features/admin/UsersPage'),
  '/admin/settings': () => import('@/features/admin/SettingsPage'),
  '/assistant/registrations': () => import('@/features/leads/LeadsPage'),
};

export function prefetchDashboardRoute(path: string) {
  const workspacePath = /^\/admin\/courses\/[^/]+/.test(path) ? '/admin/courses/:id' : path;
  const load = workspacePath === '/admin/courses/:id'
    ? () => import('@/features/courses/CourseWorkspacePage')
    : routeImports[workspacePath];
  if (load) void load().catch(() => undefined);
}

export function prefetchDashboardRoutes(area: 'admin' | 'assistant') {
  const paths = area === 'admin'
    ? ['/admin/courses', '/admin/registrations', '/admin/settings']
    : ['/assistant/registrations'];
  paths.forEach(prefetchDashboardRoute);
}
