// MOCK: revision workflow is replaced by the API in A2.
import { mockAuthService } from './auth.mock';
import { consumeStaleSimulation, readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import type { CourseRecord } from '@/schemas/course';
import { PageConfigSchema, type PageConfig } from '@/schemas/sections';
import { CourseDetailsSchema, type CourseDetails } from '@/schemas/course';
import type { Revision } from '@/schemas/revision';
import { mockCourseCategories } from '@/mocks/categories';
import { checkReadiness } from '@/schemas/courseReadiness';

export class RevisionError extends Error {
  constructor(
    public code: 'forbidden' | 'stale' | 'not_found' | 'invalid',
    message: string,
  ) {
    super(message);
  }
}
async function actor(admin = false) {
  const user = await mockAuthService.getCurrentUser();
  if (!user || (admin && user.role !== 'admin'))
    throw new RevisionError('forbidden', 'Not permitted');
  return user;
}
function countChanges(before: unknown, after: unknown): number {
  if (JSON.stringify(before) === JSON.stringify(after)) return 0;
  if (
    typeof before === 'object' &&
    before !== null &&
    typeof after === 'object' &&
    after !== null &&
    !Array.isArray(before) &&
    !Array.isArray(after)
  ) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].reduce(
      (count, key) =>
        count +
        countChanges(
          (before as Record<string, unknown>)[key],
          (after as Record<string, unknown>)[key],
        ),
      0,
    );
  }
  return 1;
}
function summary(
  details: CourseDetails,
  pageConfig: PageConfig,
  beforeDetails = details,
  beforePage = pageConfig,
) {
  return {
    detailsChanged: countChanges(beforeDetails, details),
    sectionsChanged: countChanges(beforePage.sections, pageConfig.sections),
  };
}
export const revisionsService = {
  async listForCourse(courseId: string) {
    await actor();
    return readMockDb().revisions.filter((item) => item.courseId === courseId);
  },
  async listQueue(status: 'pending_review' | 'rejected' = 'pending_review') {
    await actor(true);
    return readMockDb()
      .revisions.filter((item) => item.status === status)
      .sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? ''));
  },
  async listMine() {
    const user = await actor();
    return readMockDb().revisions.filter((item) => item.authorId === user.id);
  },
  async get(id: string) {
    const user = await actor();
    const revision = readMockDb().revisions.find((item) => item.id === id);
    if (!revision) throw new RevisionError('not_found', 'المراجعة مش موجودة.');
    if (user.role !== 'admin' && revision.authorId !== user.id)
      throw new RevisionError('forbidden', 'Not permitted');
    return revision;
  },
  async ensureEditableRevision(course: CourseRecord) {
    const user = await actor();
    const db = readMockDb();
    const storedCourse = db.courses.find((item) => item.id === course.id && !item.deletedAt);
    if (!storedCourse) throw new RevisionError('not_found', 'ما لقيناش الكورس.');
    if (
      (storedCourse.status as string) === 'pending_review' ||
      db.revisions.some(
        (item) => item.courseId === storedCourse.id && item.status === 'pending_review',
      )
    )
      throw new RevisionError('invalid', 'Revision is pending review');
    let revision = db.revisions.find(
      (item) =>
        item.courseId === storedCourse.id &&
        item.authorId === user.id &&
        ['draft', 'rejected'].includes(item.status),
    );
    if (revision?.status === 'rejected') {
      revision.status = 'draft';
      revision.baseVersion = storedCourse.publishedVersion;
      revision.rejectionReason = undefined;
      recordMockAudit(db, user.id, 'revision.reopened', revision.id);
      writeMockDb(db);
    }
    if (!revision) {
      const details = storedCourse.details || storedCourse.draft?.details;
      const pageConfig = storedCourse.pageConfig || storedCourse.draft?.page;
      revision = {
        id: crypto.randomUUID(),
        courseId: course.id,
        kind: storedCourse.publishedVersion ? 'update' : 'new_course',
        status: 'draft',
        authorId: user.id,
        baseVersion: storedCourse.publishedVersion,
        createdAt: new Date().toISOString(),
        snapshot: { details: details!, pageConfig: pageConfig! },
        summary: summary(details!, pageConfig!),
      };
      db.revisions.unshift(revision);
      recordMockAudit(db, user.id, 'revision.created', revision.id);
      writeMockDb(db);
    }
    return revision;
  },
  async save(id: string, details: CourseDetails, pageConfig: PageConfig, baseVersion: number) {
    const user = await actor();
    if (consumeStaleSimulation())
      throw new RevisionError('stale', 'الكورس changed since editing began');
    const db = readMockDb();
    const revision = db.revisions.find((item) => item.id === id);
    const course = db.courses.find((item) => item.id === revision?.courseId);
    if (!revision || !course) throw new RevisionError('not_found', 'المراجعة مش موجودة.');
    if (revision.authorId !== user.id && user.role !== 'admin')
      throw new RevisionError('forbidden', 'Not permitted');
    if (revision.baseVersion !== baseVersion || course.publishedVersion !== baseVersion)
      throw new RevisionError('stale', 'الكورس changed since editing began');
    if (revision.status !== 'draft' && revision.status !== 'rejected')
      throw new RevisionError('invalid', 'Revision is read only');
    const validatedDetails = CourseDetailsSchema.parse(details);
    const validatedPage = PageConfigSchema.parse(pageConfig);
    if (!mockCourseCategories.includes(validatedDetails.category))
      throw new RevisionError('invalid', 'Choose a managed category');
    if (
      user.role !== 'admin' &&
      validatedDetails.accreditation.verifiedByAcademy !==
        (course.details?.accreditation.verifiedByAcademy ?? false)
    )
      throw new RevisionError('forbidden', 'Only Admin can verify accreditation');
    revision.snapshot = { details: validatedDetails, pageConfig: validatedPage };
    revision.summary = summary(validatedDetails, validatedPage, course.details || course.draft?.details, course.pageConfig || course.draft?.page);
    revision.status = 'draft';
    revision.rejectionReason = undefined;
    recordMockAudit(db, user.id, 'revision.saved', id);
    writeMockDb(db);
    return revision;
  },
  async submit(id: string) {
    const user = await actor();
    const db = readMockDb();
    const revision = db.revisions.find((item) => item.id === id);
    if (!revision || revision.authorId !== user.id)
      throw new RevisionError('forbidden', 'Not permitted');
    if (
      db.revisions.some(
        (item) =>
          item.courseId === revision.courseId &&
          item.id !== revision.id &&
          item.status === 'pending_review',
      )
    )
      throw new RevisionError('invalid', 'A revision is already pending review');
    const sourceCourse = db.courses.find((item) => item.id === revision.courseId);
    const readiness = checkReadiness(revision.snapshot, sourceCourse?.slug);
    if (readiness.errors.length)
      throw new RevisionError('invalid', 'الكورس readiness checks failed');
    revision.status = 'pending_review';
    revision.submittedAt = new Date().toISOString();
    const course = db.courses.find((item) => item.id === revision.courseId);
    if (course && !course.publishedVersion) course.status = 'pending_review';
    db.notifications.unshift({
      id: crypto.randomUUID(),
      type: 'course_submitted',
      entityId: revision.id,
      courseId: revision.courseId,
      recipientRole: 'admin',
      createdAt: revision.submittedAt,
      readAt: null,
    });
    recordMockAudit(db, user.id, 'revision.submitted', id);
    writeMockDb(db);
    return revision;
  },
  async approve(id: string, publishImmediately = true) {
    const user = await actor(true);
    if (consumeStaleSimulation()) throw new RevisionError('stale', 'Revision is stale');
    const db = readMockDb();
    const revision = db.revisions.find((item) => item.id === id);
    const course = db.courses.find((item) => item.id === revision?.courseId);
    if (!revision || !course) throw new RevisionError('not_found', 'المراجعة مش موجودة.');
    if (revision.status !== 'pending_review')
      throw new RevisionError('invalid', 'Only pending revisions can be approved');
    if (user.role === 'assistant' && revision.authorId === user.id)
      throw new RevisionError('forbidden', 'Self approval is not allowed');
    if (revision.baseVersion !== course.publishedVersion)
      throw new RevisionError('stale', 'Revision is stale');
    if (checkReadiness(revision.snapshot, course.slug).errors.length)
      throw new RevisionError('invalid', 'الكورس readiness checks failed');
    revision.status = 'approved';
    revision.reviewerId = user.id;
    revision.reviewedAt = new Date().toISOString();
    if (course.slug !== (revision.snapshot.details.slug || course.slug))
      course.slugHistory.push(course.slug);
    course.details = revision.snapshot.details;
    course.pageConfig = revision.snapshot.pageConfig;
    if (publishImmediately || revision.kind === 'update') {
      course.publishedVersion += 1;
      course.status = 'published';
    } else course.status = 'draft';
    course.updatedAt = revision.reviewedAt;
    db.notifications.unshift({
      id: crypto.randomUUID(),
      type: 'revision_approved',
      entityId: course.id,
      courseId: course.id,
      recipientRole: 'assistant',
      recipientId: revision.authorId,
      createdAt: revision.reviewedAt,
      readAt: null,
    });
    recordMockAudit(db, user.id, 'revision.approved', id);
    writeMockDb(db);
    return revision;
  },
  async reject(id: string, reason: string) {
    const user = await actor(true);
    if (reason.trim().length < 10 || reason.trim().length > 1000)
      throw new RevisionError('invalid', 'Rejection reason must be 10-1000 characters');
    const db = readMockDb();
    const revision = db.revisions.find((item) => item.id === id);
    if (!revision) throw new RevisionError('not_found', 'المراجعة مش موجودة.');
    if (revision.status !== 'pending_review')
      throw new RevisionError('invalid', 'Only pending revisions can be rejected');
    revision.status = 'rejected';
    revision.rejectionReason = reason.trim();
    revision.reviewerId = user.id;
    revision.reviewedAt = new Date().toISOString();
    const course = db.courses.find((item) => item.id === revision.courseId);
    if (course && course.publishedVersion === 0) course.status = 'rejected';
    db.notifications.unshift({
      id: crypto.randomUUID(),
      type: 'revision_rejected',
      entityId: revision.courseId,
      courseId: revision.courseId,
      recipientRole: 'assistant',
      recipientId: revision.authorId,
      createdAt: revision.reviewedAt,
      readAt: null,
    });
    recordMockAudit(db, user.id, 'revision.rejected', id);
    writeMockDb(db);
    return revision;
  },
  async rollbackTo(id: string, publishNow = false) {
    const user = await actor(true);
    const db = readMockDb();
    const source = db.revisions.find((item) => item.id === id);
    const course = db.courses.find((item) => item.id === source?.courseId);
    if (!source || !course) throw new RevisionError('not_found', 'الإصدار مش موجود.');
    const revision: Revision = {
      id: crypto.randomUUID(),
      courseId: course.id,
      kind: 'update',
      status: publishNow ? 'approved' : 'draft',
      authorId: user.id,
      baseVersion: course.publishedVersion,
      createdAt: new Date().toISOString(),
      reviewerId: publishNow ? user.id : undefined,
      reviewedAt: publishNow ? new Date().toISOString() : undefined,
      snapshot: source.snapshot,
      summary: summary(
        source.snapshot.details,
        source.snapshot.pageConfig,
        course.details,
        course.pageConfig,
      ),
    };
    db.revisions.unshift(revision);
    if (publishNow) {
      if (course.slug !== (source.snapshot.details.slug || course.slug))
        course.slugHistory.push(course.slug);
      course.details = source.snapshot.details;
      course.pageConfig = source.snapshot.pageConfig;
      course.publishedVersion += 1;
      course.status = 'published';
      course.updatedAt = revision.reviewedAt!;
    }
    recordMockAudit(db, user.id, 'course.rolled_back', course.id);
    writeMockDb(db);
    return revision;
  },
};
