# Frontend final handoff

## What is built

| Area | Screens and data |
| --- | --- |
| Public | Home, catalog, published course landing/registration, safe confirmation, legal pages. Uses public settings, published courses, categories and registration APIs. |
| Authentication | Login, invite acceptance, password reset; cookie-based API client with CSRF and refresh handling. |
| Admin | Overview, courses/studio, registrations, users/invites, settings/categories. |
| Assistant | Registration list/detail, follow-up, notes, WhatsApp contact and payment actions. Route guard limits the role to registration routes. |

## Route, role and API map

| Path | Role / guard | Screen and API calls |
| --- | --- | --- |
| `/` | Visitor | Replace redirect to `/ar` |
| `/en/*` | Visitor | Replace redirect to matching `/ar/*` |
| `/ar` | Visitor | Home: `GET /settings/public`, `GET /public/courses?featured=true&page=1&pageSize=12` |
| `/ar/courses` | Visitor | Catalog: `GET /categories/public`, `GET /public/courses` with filters/page |
| `/ar/courses/:slug` | Visitor | Published page: `GET /public/courses/:slug`; registration: `POST /public/registrations` |
| `/ar/register-confirmation/:reference` | Visitor | Safe confirmation: `GET /public/registrations/:reference` |
| `/ar/privacy`, `/ar/terms` | Visitor | Legal content: `GET /settings/public` |
| `/ar/login` | Visitor | CSRF bootstrap, `POST /auth/login`; session restoration `GET /auth/me` |
| `/ar/invite/:token` | Visitor | `GET /auth/invites/:token`, `POST /auth/invites/accept` |
| `/ar/forgot-password` | Visitor | `POST /auth/password-reset/request` |
| `/ar/reset-password/:token` | Visitor | `POST /auth/password-reset/confirm` |
| `/admin` | Admin: `RequireAuth` + `RequireRole(admin)` | Overview: `GET /admin/overview` |
| `/admin/courses` | Admin: same | List/create: `GET /courses`, `POST /courses`, `GET /courses/check-slug`, `GET /categories/public` |
| `/admin/courses/:courseId/studio/:tab` | Admin: same | Studio: `GET /courses/:id`, `PUT /courses/:id/draft`, publish/unpublish/archive calls, media APIs |
| `/admin/courses/:courseId/studio/page/:sectionId` | Admin: same | Focused section editor; same course and media APIs |
| `/admin/courses/:courseId/preview` | Admin: same | Working-copy preview (session storage) |
| `/admin/registrations` | Admin: same | `GET /enrollments`, `GET /enrollments/filters`, CSV export adapter |
| `/assistant/registrations` | Assistant or Admin: authenticated role guard | `GET /enrollments`, `GET /enrollments/filters` |
| `/admin/registrations/:id` | Admin: same | Enrollment detail, `GET /users`, notes and payment APIs |
| `/assistant/registrations/:id` | Assistant or Admin: role guard | Enrollment detail, notes and permitted payment/follow-up APIs |
| `/admin/users` | Admin: same | `GET /users`, `GET /invites`, invite and activation mutations |
| `/admin/settings` | Admin: same | `GET/PATCH /settings`, categories and media endpoints |
| `/not-authorized` | Access-denied outcome | Arabic access-denied page |
| Unknown path | Public/admin/assistant area | Area-specific Arabic 404; no data API |

The shared shell also reads `GET /auth/me` and public academy settings. Route entries were checked against `src/app/router.tsx`, `src/app/areas`, and the area page switchers; actual permission behavior still needs browser testing.

## Run and build

From `PASSION_FRONTEND` run `npm install`, `npm run dev`, then `npm run typecheck`, `npm run lint`, `npm run check:i18n`, `npm run check:routes`, `npx vitest run`, and `npm run build`.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` | Backend API root; configure for the deployed backend or same-origin proxy |
| `VITE_API_PROXY_TARGET` | `http://localhost:4000` | Local Vite `/api` proxy destination |
| `VITE_SITE_URL` | unset | Canonical site URL / SEO |
| `VITE_MEDIA_BASE_URL` | unset | Base URL for public media keys |

## Data flow

Studio edits a working draft and saves with an expected version. Publish validates readiness and asks the API to publish a snapshot; later edits remain draft until republished. Public pages and catalog read published snapshots only. Registration sends field-id answers, attribution, honeypot and idempotency key; confirmation exposes only the reference-safe response. Staff reads enrollment snapshots and derived payment summary, appends notes and records payment actions through the API. Receipt upload uses the private endpoint, while signed URLs are requested only on click; public images use relative media keys and responsive variants through `mediaUrl`.

## Screen states and interaction coverage

| Screens | Loading | Empty / unavailable | Error/retry |
| --- | --- | --- | --- |
| Home/catalog | Course skeletons | Empty course states | Course/settings/category fetches have retry |
| Landing/confirmation | Route skeleton/spinner | Not-found state | Fetch errors have retry |
| Login/invite/reset | Submit/token loading | Invalid token state | Retry by resubmitting; invalid reset links lead to request flow |
| Overview/courses/studio | Query skeletons | Empty list/missing course | Query retry and Arabic mutation errors |
| Registrations/customer | Query skeletons | Empty list/missing record | Query retry and Arabic mutation errors |
| Users/settings/media/legal | Skeletons | Empty users/invites/categories/media or unconfigured legal page | Query retry |

Unexpected render errors show an Arabic app fallback with reload/home actions. Settings and studio protect dirty edits; the registration form editor participates in studio dirty state. Radix dialogs provide focus trapping and Escape handling. These behaviors are static code findings and require owner browser testing.

## Images, fonts, RTL and contrast

`SmartImage` sets width/height, uses lazy loading by default, `srcSet` variants and the configured media resolver. Hero imagery is eager/high priority. Public non-hero landing sections mount near the viewport. No video embed is currently present. Self-hosted Cairo weights 400/500/600/700 and Inter 400/700 use Fontsource `font-display: swap`. Logical CSS utility scan found no physical left/right utility classes under `src`; shared controls include focus-visible styling and inputs use labels or Arabic accessible names.

Light-theme contrast against white and canvas respectively: primary `#036b9a` 5.88:1 / 5.62:1; muted `#475569` 7.58:1 / 7.24:1; subtle `#64748b` 4.76:1 / 4.55:1; success `#15803d` 5.02:1 / 4.79:1; warning `#b45309` 5.02:1 / 4.80:1; danger `#b91c1c` 6.47:1 / 6.18:1. Accent `#00d2ff` is 1.80:1 on white and is decorative only. Dark theme and rendered contrast remain unverified in browser.

## Build chunk comparison

Baseline and final numbers are Vite minified chunk sizes (gzip in parentheses). The public landing route's own chunks changed from `CourseDetailPage` 4.49 KB (2.02 KB) + `PageRenderer` 10.38 KB (3.95 KB) to 4.83 KB (2.08 KB) + 11.45 KB (4.28 KB). Home changed from 6.40 KB (2.25 KB) to 7.37 KB (2.72 KB). Studio's prior `AdminPage`-grouped chunk was 181.79 KB (49.59 KB); it is now the deferred `CourseWorkspacePage` chunk at 149.09 KB (40.27 KB), with `AdminPage` 2.57 KB (1.08 KB), area wrapper 0.81 KB (0.47 KB), and DashboardLayout 25.06 KB (8.79 KB) split separately. Shared entry decreased from 765.77 KB (241.08 KB) to 670.94 KB (212.57 KB), but still triggers Vite's 500 KB warning. Studio/editor, dnd-kit and rich-text editor code are absent from the public entry; the owner should confirm actual network requests in browser devtools.

## Limitations

- No browser was controlled in this review. Refresh, layouts, focus behavior and route permissions require the owner’s browser pass.
- Build still reports a large shared entry chunk. Studio, dnd-kit and rich-text editor code are route-separated, while shared dependencies remain in the entry.
- See `docs/INTEGRATION_MAP.md` for outstanding enrollment filter UI, receipt identifier and CSV search adapter gaps.
- Crawler-specific social metadata still needs the hosting/backend route described in `docs/LINK_PREVIEW.md`.
- Build emits multiple font language subsets even though only the noted weights are imported.

## Needs the owner's browser test

1. Visit `/ar`, `/ar/courses`, and a published course; inspect console/network and confirm admin/editor chunks are absent from the landing route.
2. Hard refresh a landing URL, `/admin/courses`, `/admin/courses/:id/studio/page/:sectionId`, `/assistant/registrations` and `/ar/login`; verify hosting fallback and access boundaries.
3. Edit a studio section, switch preview widths (1200/768/375), and navigate away with dirty changes.
4. As Admin test course draft/publish, overview filters, registration detail, settings and media; as Assistant test registration-only access and payment.
5. At desktop and 375px keyboard-test dialogs, Escape/focus trapping, focus indicators and image layout stability.
