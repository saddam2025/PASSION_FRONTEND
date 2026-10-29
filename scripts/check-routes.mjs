import { readFile } from 'node:fs/promises';

const navSource = await readFile(
  new URL('../src/features/dashboard/nav.config.ts', import.meta.url),
  'utf8',
);
const routerSource = await readFile(new URL('../src/app/router.tsx', import.meta.url), 'utf8');
const adminSource = await readFile(
  new URL('../src/features/pages/AdminPage.tsx', import.meta.url),
  'utf8',
);
const assistantSource = await readFile(
  new URL('../src/features/pages/AssistantPage.tsx', import.meta.url),
  'utf8',
);
const workspaceSource = await readFile(
  new URL('../src/features/courses/CourseWorkspacePage.tsx', import.meta.url),
  'utf8',
);
const navItems = [...navSource.matchAll(/id:\s*'([^']+)'[\s\S]*?path:\s*'([^']+)'/g)].map(
  ([, id, path]) => ({ id, path }),
);
const errors = [];
const paths = new Map();
const REQUIRED_ROUTES = [
  { area: 'admin', route: '/courses', marker: "pathname === '/admin/courses'" },
  { area: 'admin', route: '/courses/new', marker: "pathname === '/admin/courses/new'" },
  { area: 'admin', route: '/courses/:courseId', marker: '<CourseWorkspacePage />', nested: true },
  {
    area: 'admin',
    route: '/courses/:courseId/edit',
    marker: "pathname.endsWith('/edit')",
    nested: true,
  },
  {
    area: 'admin',
    route: '/courses/:courseId/history',
    marker: "pathname.endsWith('/history')",
    nested: true,
  },
  {
    area: 'admin',
    route: '/courses/:courseId/builder',
    marker: "pathname.endsWith('/builder')",
    nested: true,
  },
  {
    area: 'admin',
    route: '/courses/:courseId/preview',
    marker: "pathname.endsWith('/preview')",
    nested: true,
  },
  { area: 'assistant', route: '/courses', marker: "pathname === '/assistant/courses'" },
  { area: 'assistant', route: '/courses/new', marker: "pathname === '/assistant/courses/new'" },
  {
    area: 'assistant',
    route: '/courses/:courseId',
    marker: '<CourseWorkspacePage assistant />',
    nested: true,
  },
  {
    area: 'assistant',
    route: '/courses/:courseId/edit',
    marker: "pathname.endsWith('/edit')",
    nested: true,
  },
  {
    area: 'assistant',
    route: '/courses/:courseId/history',
    marker: "pathname.endsWith('/history')",
    nested: true,
  },
  {
    area: 'assistant',
    route: '/courses/:courseId/builder',
    marker: "pathname.endsWith('/builder')",
    nested: true,
  },
  {
    area: 'assistant',
    route: '/courses/:courseId/preview',
    marker: "pathname.endsWith('/preview')",
    nested: true,
  },
  { area: 'assistant', route: '/submissions', marker: "pathname === '/assistant/submissions'" },
  { area: 'assistant', route: '/notifications', marker: "pathname === '/assistant/notifications'" },
  { area: 'admin', route: '/notifications', marker: "pathname === '/admin/notifications'" },
  { area: 'admin', route: '/review', marker: "pathname === '/admin/review'" },
  { area: 'admin', route: '/review/:revisionId', marker: '/^\\/admin\\/review\\/[^/]+/' },
  { area: 'public', route: '/:lang/terms', marker: 'path="terms"' },
];

for (const item of navItems) {
  if (
    !item.path.startsWith('/admin/') &&
    item.path !== '/admin' &&
    !item.path.startsWith('/assistant/') &&
    item.path !== '/assistant'
  ) {
    errors.push(`${item.id}: dashboard href must use /admin or /assistant prefix (${item.path})`);
  }
  if (/^\/(ar|en)\//.test(item.path))
    errors.push(`${item.id}: dashboard href cannot have a language prefix (${item.path})`);
  const prior = paths.get(item.path);
  if (prior) errors.push(`${item.id} and ${prior} resolve to the same href (${item.path})`);
  paths.set(item.path, item.id);

  const area = item.path.startsWith('/admin') ? 'admin' : 'assistant';
  const dispatch = area === 'admin' ? adminSource : assistantSource;
  if (!routerSource.includes(`path="/${area}/*"`) || !dispatch.includes(item.path)) {
    errors.push(`${item.id}: no matching registered route/dispatcher entry (${item.path})`);
  }
}

for (const required of REQUIRED_ROUTES) {
  if (required.area === 'public') {
    if (!routerSource.includes(required.marker))
      errors.push(`Required public route ${required.route} is missing or not dispatched.`);
    continue;
  }
  const dispatcher = required.area === 'admin' ? adminSource : assistantSource;
  const routeExists =
    required.area === 'admin'
      ? routerSource.includes('path="/admin/*"')
      : routerSource.includes('path="/assistant/*"');
  const source = required.nested ? workspaceSource : dispatcher;
  const nestedDispatch = required.nested
    ? dispatcher.includes(
        required.area === 'admin'
          ? '/^\\/admin\\/courses\\/[^/]+/'
          : '/^\\/assistant\\/courses\\/[^/]+/',
      ) &&
      dispatcher.includes(
        `return <CourseWorkspacePage${required.area === 'assistant' ? ' assistant' : ''} />`,
      )
    : true;
  const componentFound =
    required.route === '/courses/:courseId' || source.includes(required.marker);
  if (
    !routeExists ||
    !nestedDispatch ||
    !dispatcher.includes(
      required.nested
        ? `return <CourseWorkspacePage${required.area === 'assistant' ? ' assistant' : ''} />`
        : required.marker,
    ) ||
    !componentFound
  ) {
    errors.push(`Required ${required.area} route ${required.route} is missing or not dispatched.`);
  }
  if (dispatcher.includes('PlaceholderPage')) {
    errors.push(`Required ${required.area} route ${required.route} points at a placeholder.`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Route check passed for ${navItems.length} dashboard navigation items and ${REQUIRED_ROUTES.length} required routes.`,
  );
}
