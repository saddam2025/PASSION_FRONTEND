# Frontend mock data (local development only)

Every value in this folder is fake and must be removed or replaced when APIs are integrated in batch A4. These are UI preview values, never real accounts or invitations.

## Mock sign-in accounts

Use either address with its matching password in the local mock login form:

- Admin: `admin@example.test` / `MockAdmin!234`
- Assistant: `assistant@example.test` / `MockAssistant!234`

The assistant mock uses the default permission set: it can view leads, update follow-up, view payment records, and manage notes. It cannot record payments, export CSV, or view financial reports unless an Admin grants those permissions. Mock passwords are checked against salted SHA-256 hashes and are never persisted as plaintext (MOCK-ONLY; real argon2id arrives in B3). Sessions store only a user id; deactivating that user invalidates the next service call.

## Registration and lead workflow

Register on a currently published mock course with registration enabled, wait at least two seconds after the form appears, then submit. The service creates/updates the visitor's lead and a separate enrollment in `mock.db.v2`, stores form-label snapshots, and redirects to a PAS-XXXXXX confirmation reference. Use the same email and course again to exercise duplicate protection; submit twice with the same browser form to exercise idempotency. The lead and enrollment appear in the shared Admin/Assistant Leads page. A different email with the same normalized phone is flagged as a possible duplicate and is not merged.

## Invitation links and lockout

Sign in as Admin and open **Users and invites → Invite assistant**. The raw invite URL is shown once; copy it or use the WhatsApp share action. Stored mock records contain only SHA-256 token hashes. Accept the invite through the public `/{lang}/invite/{token}` route, then sign in with the invited email. Resend rotates the token hash; revoke invalidates it. Invalid, expired, revoked, accepted, and rotated tokens return the same generic invalid-link state. Five failed logins lock a known mock account for 15 minutes. The mock displays a countdown and writes login audit events.

## Password reset links

Admins can generate a one-hour reset link from the users page. Its raw token is returned only in the one-time link dialog; `mock.db.v2` stores only a SHA-256 hash. Expired and used links share the generic invalid-link page. Forgot-password responses do not reveal whether an email exists.

### Public registration confirmation

Registration references are generated dynamically as `PAS-XXXXXX` and live in `mock.db.v2`; use the visitor registration flow above to create one. Unknown references show the generic not-found state. Duplicate submissions return a neutral confirmation without customer details.

## Resetting the mock database

Use **Reset mock data** in the development user menu to clear persisted courses, leads, enrollments, payments, notes, invites, settings, and audit events. The documented sign-in accounts are re-seeded on the next mock authentication call. Generated registration references and invite links are not fixed test references.

## Payment workflow

Payments are manual MOCK records in the same DB as enrollments. The amount input uses the enrollment currency and converts to minor units. Services enforce `recordPayments`, require explicit acknowledgement above the outstanding amount, and derive payment status from confirmed records. Only Admin can refund or void through the service; corrections never delete payment records. Receipt upload uses the isolated MOCK private-media service and is not routed through the public media URL helper.

## Course detail and section preview (F4)

- Published mock courses: `/ar/courses/communication-skills` (registration open) and `/ar/courses/learning-basics` (registration closed); replace `ar` with `en` for English.
- Archived course: `/ar/courses/archived-course` shows the generic not-found state.
- Legacy slug: `/ar/courses/old-course-name` redirects to the current `learning-basics` slug.
- Development playground: `/dev/sections` renders the clearly labelled sample course with all 20 section types; its width controls and language switcher are development-only.
- Sample data is fictional and must be removed or replaced when APIs are integrated in batch A4.

## Media library

The F5 builder media dialog reads and uploads through the typed media service. In the frontend phase it uses local MOCK records and simulated progress; object URLs are limited to the temporary file preview and revoked afterward. Public page data stores only an ImageRef with a relative key and bilingual alt text. The backend API adapter sends multipart data to the application server, never directly to R2.

## Course, revision and notification workflow (F6 MOCK)

- The mock sign-in accounts above exercise the Admin and Assistant roles. Course workflow state is kept in localStorage at `mock.db.v2`; the mock accounts remain in session storage.
- An Assistant can create and edit a draft at `/assistant/courses`, then submit it when the details and page sections pass readiness. An Admin reviews submissions at `/admin/review`, checks structured changes and the live/proposed preview, then approves or rejects with a reason.
- New courses are not returned by public course services until published. Editing a published course creates a separate revision, so public pages continue using the existing published snapshot until Admin approval.
- To inspect stale checks, choose “Simulate stale conflict once” from the development user menu, then perform the next course save, revision save or approval; the MOCK service returns a typed stale conflict. You can also use two tabs and approve a newer base version before continuing an older edit.
- From the development user menu, choose “Reset mock data” to clear the persisted workflow store and return to seed courses. Reset also clears the one-time stale simulation flag.
- The F5 page builder field kit and its full section-editing workflow are not present yet; F6 course details and approval UI currently reuse the available media dialog and F4 renderer, while section editing remains for F5 completion.


## Course-management v2 seed

The schema-validated MOCK store seeds draft, pending-review, published, and archived courses, a pending revision, published slug history, and an enrollment. Older mock.db.v1 or invalid v2 payloads are discarded with a DEV-only warning. The Admin course list requires slug confirmation for deletion and preserves courses with enrollment or payment history. The current page manager supports Hero, Text, and Registration Form section insertion, visibility, ordering, and preview; the complete F5 field kit and editing controls for all 20 section types remain unfinished.
