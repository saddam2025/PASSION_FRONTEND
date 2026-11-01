import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const actorState = vi.hoisted(() => ({ role: 'admin' as 'admin' | 'assistant' }));
vi.mock('@/services/auth.mock', () => ({
  mockAuthService: {
    getCurrentUser: vi.fn(async () => actorState.role === 'admin' ? ({
      id: 'user-admin-001', name: { ar: 'مدير', en: '' }, email: 'admin@example.test', role: 'admin', permissions: [],
    }) : ({
      id: 'user-assistant-001', name: { ar: 'مساعد', en: '' }, email: 'assistant@example.test', role: 'assistant', permissions: [],
    })),
  },
}));

import { coursesService } from './service';
import { COURSES_STORAGE_KEY, readCourses, resetCourses, writeCourses } from './storage';
import { readMockDb } from '@/mocks/db';

async function resultCode<T>(resultPromise: Promise<{ ok: true; data: T } | { ok: false; code: string }>) {
  const result = await resultPromise;
  return result.ok ? 'OK' : result.code;
}

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
  clear: () => values.clear(),
  key: (index: number) => [...values.keys()][index] ?? null,
  get length() {
    return values.size;
  },
};

describe('courses service persistence', () => {
  beforeEach(() => {
    values.clear();
    vi.stubGlobal('window', { localStorage: storage });
    actorState.role = 'admin';
    resetCourses();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('creates a templated draft and persists versioned edits across reads', async () => {
    const created = await coursesService.create({
      title: { ar: 'كورس اختبارية', en: '' },
      category: 'Coaching',
      slug: 'persistence-smoke-course',
      template: 'short',
    });

    expect(created).toEqual(expect.objectContaining({ ok: true }));
    if (!created.ok) return;
    expect(created.data.draft.page.sections.length).toBeGreaterThan(0);
    expect(values.has(COURSES_STORAGE_KEY)).toBe(true);

    const updatedSnapshot = {
      ...created.data.draft,
      details: {
        ...created.data.draft.details,
        shortDescription: { ar: 'حفظ مستمر', en: '' },
      },
    };
    const saved = await coursesService.saveDraft(
      created.data.id,
      updatedSnapshot,
      created.data.version,
    );

    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.data.version).toBe(created.data.version + 1);
    const persisted = readCourses().find((course) => course.id === created.data.id);
    expect(persisted?.draft.details.shortDescription.ar).toBe('حفظ مستمر');
  });

  it('refuses all privileged course transitions when called directly by an Assistant', async () => {
    actorState.role = 'assistant';
    expect(await resultCode(coursesService.publish('course-seed-001'))).toBe('FORBIDDEN');
    expect(await resultCode(coursesService.approve('course-seed-002'))).toBe('FORBIDDEN');
    expect(await resultCode(coursesService.unpublish('course-seed-001'))).toBe('FORBIDDEN');
    expect(await resultCode(coursesService.archive('course-seed-001'))).toBe('FORBIDDEN');
    expect(await resultCode(coursesService.remove('course-seed-001'))).toBe('FORBIDDEN');
    expect(await resultCode(coursesService.rollback('course-seed-001', 1))).toBe('FORBIDDEN');
    expect(await resultCode(coursesService.approveDeletion('course-seed-001'))).toBe('FORBIDDEN');
    expect(await resultCode(coursesService.rejectDeletion('course-seed-001', 'سبب كافي للاختبار'))).toBe('FORBIDDEN');
  });

  it('refuses double submission, locks pending drafts and supports author withdrawal', async () => {
    actorState.role = 'assistant';
    const submitted = await coursesService.submit('course-seed-003');
    expect(submitted.ok).toBe(true);
    expect(await resultCode(coursesService.submit('course-seed-003'))).toBe('INVALID_TRANSITION');
    if (submitted.ok) {
      expect(await resultCode(coursesService.saveDraft('course-seed-003', submitted.data.draft))).toBe('REVIEW_PENDING');
    }
    const withdrawn = await coursesService.withdraw('course-seed-003');
    expect(withdrawn.ok && withdrawn.data.review.state).toBe('none');
    expect(readMockDb().audit.some((event) => event.action === 'revision.reopened')).toBe(true);
    expect(readMockDb().audit.some((event) => event.action === 'revision.submitted')).toBe(true);
    expect(readMockDb().notifications.some((item) => item.type === 'course_submitted' && item.recipientRole === 'admin')).toBe(true);
    expect(readMockDb().notifications.some((item) => item.type === 'course_withdrawn' && item.recipientRole === 'admin')).toBe(true);
  });

  it('requires a rejection reason, retains it, and permits resubmission of the same draft', async () => {
    actorState.role = 'assistant';
    expect((await coursesService.submit('course-seed-003')).ok).toBe(true);
    actorState.role = 'admin';
    expect(await resultCode(coursesService.reject('course-seed-003', ''))).toBe('REASON_REQUIRED');
    const rejected = await coursesService.reject('course-seed-003', 'استكمل تفاصيل المحتوى قبل النشر');
    expect(rejected.ok && rejected.data.review.reason).toBe('استكمل تفاصيل المحتوى قبل النشر');
    actorState.role = 'assistant';
    expect((await coursesService.submit('course-seed-003')).ok).toBe(true);
    expect(readCourses().find((course) => course.id === 'course-seed-003')?.review.state).toBe('pending');
    expect(readMockDb().notifications.some((item) => item.type === 'revision_rejected' && item.recipientId === 'user-assistant-001')).toBe(true);
    expect(readMockDb().audit.some((event) => event.action === 'revision.rejected' && event.entityId === 'course-seed-003')).toBe(true);
  });

  it('treats Admin publish during pending review as approval and rejects archived or invalid approvals', async () => {
    const pending = readCourses().find((course) => course.id === 'course-seed-002')!;
    expect((await coursesService.publish(pending.id)).ok).toBe(true);
    const published = readCourses().find((course) => course.id === pending.id)!;
    expect(published.review.state).toBe('none');
    expect(published.review.reviewedBy).toBe('user-admin-001');
    expect(readMockDb().notifications.some((item) => item.type === 'revision_approved')).toBe(true);
    expect(readMockDb().audit.some((event) => event.action === 'revision.approved' && event.entityId === pending.id)).toBe(true);
    expect(await resultCode(coursesService.publish('course-seed-005'))).toBe('INVALID_TRANSITION');

    const invalidPending = { ...pending, draft: { ...pending.draft, details: { ...pending.draft.details, title: { ar: '', en: '' } } } };
    writeCourses(readCourses().map((course) => course.id === pending.id ? invalidPending : course));
    expect(await resultCode(coursesService.approve(pending.id))).toBe('READINESS_FAILED');
  });

  it('records direct publish and unpublish in the audit log and notifies the course author', async () => {
    const published = await coursesService.publish('course-seed-004');
    expect(published.ok).toBe(true);
    if (!published.ok) return;
    expect(readMockDb().audit.some((event) => event.action === 'course.published_directly' && event.entityId === published.data.id)).toBe(true);
    expect(readMockDb().notifications.some((item) => item.type === 'course_published' && item.recipientId === published.data.createdBy)).toBe(true);

    const unpublished = await coursesService.unpublish(published.data.id);
    expect(unpublished.ok).toBe(true);
    expect(readMockDb().audit.some((event) => event.action === 'course.unpublished' && event.entityId === published.data.id)).toBe(true);
    expect(readMockDb().notifications.some((item) => item.type === 'course_unpublished' && item.recipientId === published.data.createdBy)).toBe(true);
  });

  it('requests and cancels deletion without changing public state, with audit and Admin notification', async () => {
    actorState.role = 'assistant';
    const before = readCourses().find((course) => course.id === 'course-seed-001')!;
    expect(await resultCode(coursesService.requestDeletion(before.id, ''))).toBe('REASON_REQUIRED');
    const request = await coursesService.requestDeletion(before.id, 'الكورس لم يعد ضمن الخطة الحالية');
    expect(request.ok).toBe(true);
    expect(await resultCode(coursesService.requestDeletion(before.id, 'طلب مكرر للاختبار'))).toBe('INVALID_TRANSITION');
    if (!request.ok) return;
    expect(request.data.status).toBe(before.status);
    expect(request.data.published).toEqual(before.published);
    expect(request.data.draft.details.enrollment.registrationOpen).toBe(before.draft.details.enrollment.registrationOpen);
    expect(readMockDb().audit.some((event) => event.action === 'course.deletion_requested' && event.entityId === before.id)).toBe(true);
    expect(readMockDb().notifications.some((item) => item.type === 'course_deletion_requested' && item.recipientRole === 'admin' && item.courseId === before.id)).toBe(true);

    const withdrawn = await coursesService.cancelDeletionRequest(before.id);
    expect(withdrawn.ok && withdrawn.data.deletionRequest).toBeUndefined();
    expect(readMockDb().audit.some((event) => event.action === 'course.deletion_request_cancelled' && event.entityId === before.id)).toBe(true);
    expect(await resultCode(coursesService.cancelDeletionRequest(before.id))).toBe('INVALID_TRANSITION');
  });

  it('requires a deletion rejection reason and returns the reason to the requester with an audit event and notification', async () => {
    actorState.role = 'assistant';
    expect((await coursesService.requestDeletion('course-seed-001', 'عايز حذف الكورس ده'))).toBeTruthy();
    actorState.role = 'admin';
    expect(await resultCode(coursesService.rejectDeletion('course-seed-001', ''))).toBe('REASON_REQUIRED');
    const rejected = await coursesService.rejectDeletion('course-seed-001', 'احتفظ بالكورس لحين انتهاء التسجيلات الحالية');
    expect(rejected.ok).toBe(true);
    if (!rejected.ok) return;
    expect(rejected.data.deletionRequest).toBeUndefined();
    expect(rejected.data.deletionRequestRejection?.reason).toBe('احتفظ بالكورس لحين انتهاء التسجيلات الحالية');
    expect(rejected.data.status).toBe('published');
    expect(readMockDb().audit.some((event) => event.action === 'course.deletion_request_rejected' && event.entityId === 'course-seed-001')).toBe(true);
    expect(readMockDb().notifications.some((item) => item.type === 'course_deletion_rejected' && item.recipientId === 'user-assistant-001')).toBe(true);
  });

  it('approves a deletion as a soft delete, closes registration, hides the course, and reserves its slug', async () => {
    const leadSnapshotsBefore = readMockDb().leads;
    const enrollmentSnapshotsBefore = readMockDb().enrollments;
    actorState.role = 'assistant';
    expect((await coursesService.requestDeletion('course-seed-001', 'يجب إزالة هذا الكورس من المنصة'))).toBeTruthy();
    expect((await coursesService.getPublishedBySlug('executive-leadership')).ok).toBe(true);
    actorState.role = 'admin';
    expect((await coursesService.listPendingDeletion()).ok).toBe(true);
    expect(await resultCode(coursesService.approveDeletion('course-seed-004'))).toBe('INVALID_TRANSITION');
    const approved = await coursesService.approveDeletion('course-seed-001');
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(approved.data.deletedAt).toBeTruthy();
    expect(approved.data.draft.details.enrollment.registrationOpen).toBe(false);
    expect(approved.data.published?.details.enrollment.registrationOpen).toBe(false);
    expect(readCourses().some((course) => course.id === 'course-seed-001' && course.slug === 'executive-leadership')).toBe(true);
    expect((await coursesService.get('course-seed-001')).ok).toBe(false);
    const list = await coursesService.list();
    expect(list.ok && list.data.items.some((course) => course.id === 'course-seed-001')).toBe(false);
    const publicList = await coursesService.listPublished();
    expect(publicList.ok && publicList.data.some((course) => course.id === 'course-seed-001')).toBe(false);
    expect(await resultCode(coursesService.getPublishedBySlug('executive-leadership'))).toBe('NOT_FOUND');
    const slug = await coursesService.checkSlug('executive-leadership');
    expect(slug.ok && slug.data).toBe(false);
    expect(await resultCode(coursesService.create({ title: { ar: 'كورس آخر', en: '' }, category: 'إدارة', slug: 'executive-leadership' }))).toBe('SLUG_TAKEN');
    expect(readMockDb().audit.some((event) => event.action === 'course.deletion_approved' && event.entityId === 'course-seed-001')).toBe(true);
    expect(readMockDb().audit.some((event) => event.action === 'course.deleted' && event.entityId === 'course-seed-001')).toBe(true);
    expect(readMockDb().notifications.some((item) => item.type === 'course_deletion_approved' && item.recipientId === 'user-assistant-001')).toBe(true);
    expect(readMockDb().leads).toEqual(leadSnapshotsBefore);
    expect(readMockDb().enrollments).toEqual(enrollmentSnapshotsBefore);
  });

  it('Admin direct removal always soft-deletes and records the deletion', async () => {
    const removed = await coursesService.remove('course-seed-004');
    expect(removed.ok && removed.data.softDeleted).toBe(true);
    expect(readCourses().find((course) => course.id === 'course-seed-004')?.deletedAt).toBeTruthy();
    expect(readMockDb().audit.some((event) => event.action === 'course.deleted' && event.entityId === 'course-seed-004')).toBe(true);
  });
});
