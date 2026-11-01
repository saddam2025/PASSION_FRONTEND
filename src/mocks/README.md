# Frontend mock data (local development only)

All records in this folder are fictional, browser-local MOCK data. Replace these adapters with API-backed implementations during integration; never use mock data for real customers.

## Mock accounts

- Admin: `admin@example.test` / `MockAdmin!234`
- Assistant: `assistant@example.test` / `MockAssistant!234`

The Assistant has a fixed Scope V1 permission set: view registrations, update follow-up, view payment status, record payments, and manage notes. Assistants cannot open courses, the studio, users, settings, or Overview. Admin can create and publish courses, manage staff/settings, and view Overview.

## Product flow

1. Admin creates a course, edits its Details, Page, registration form, and SEO, then saves or publishes after readiness checks.
2. Only published, non-archived courses appear in the public catalog. The visitor registers on the course landing page and receives a reference; duplicate/idempotent submissions are handled by the mock registration service.
3. Admin and Assistant work from the registrations list and detail. Staff can update follow-up status, add internal notes, open WhatsApp, and mark paid or unpaid. Payment records remain immutable; the visible paid/unpaid state is derived from the records.
4. Admin Overview shows registration and payment totals for the selected period and a per-course summary.

## Persisted mock data

`mock.db.v2` contains courses, users, invites, password-reset records, leads, enrollments, payments, notes, audit events, registration references, and settings. Mock courses use `passion.courses.v2` and preserve separate draft and published snapshots. The store is schema-validated and migrates legacy section settings before reading them. Resetting mock data restores seeded examples; the development menu includes the reset action.

## Media

The media picker uses the typed mock media adapter. Image data stored in course snapshots uses a relative media key; the private-media adapter is reserved for private receipts. Replace both adapters with the backend media API during integration.

## Development pages

`/dev/ui-kit` and `/dev/sections` are development-only visual references, not product routes. The section playground uses the same supported section registry as the course builder; unsupported section types are not present.
