// MOCK: replace with authenticated API in A2.
import { consumeStaleSimulation, readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import {
  CourseDetailsSchema,
  CourseSchema,
  type CourseDetails,
  type CourseRecord,
  type CourseStatus,
} from '@/schemas/course';
import { CourseDraftInputSchema, type CourseDraftInput } from '@/schemas/courseDraft';
import { RevisionSchema } from '@/schemas/revision';
import { mockCourseCategories } from '@/mocks/categories';
import { mockAuthService } from './auth.mock';
import { checkReadiness } from '@/schemas/courseReadiness';
import { courseTemplates, type CourseTemplateId } from '@/features/courses/templates';

export class CourseServiceError extends Error {
  constructor(
    public code: 'forbidden' | 'not_found' | 'slug_taken' | 'stale' | 'invalid' | 'validation' | 'readiness' | 'pending_assistant_revision',
    message: string,
    public errors?: ReturnType<typeof checkReadiness>['errors'],
  ) {
    super(message);
  }
}
const requireUser = async (adminOnly = false) => {
  const user = await mockAuthService.getCurrentUser();
  if (!user || (adminOnly && user.role !== 'admin'))
    throw new CourseServiceError('forbidden', 'Not permitted');
  return user;
};
const creationRequests = new Map<string, Promise<CourseRecord>>();
export interface CourseListAdminOptions {
  status?: CourseStatus | 'all';
  search?: string;
  category?: string;
  sort?: 'newest' | 'oldest' | 'title';
  page?: number;
  pageSize?: number;
}
export const coursesAdminService = {
  async categories(): Promise<string[]> {
    await requireUser();
    const categories = readMockDb().settings.values.categories;
    if (categories && typeof categories === 'object' && !Array.isArray(categories)) {
      const items = (categories as Record<string, unknown>).items;
      if (Array.isArray(items)) {
        const names = items.flatMap((item): string[] => {
          if (typeof item === 'string') return [item];
          if (item && typeof item === 'object' && 'name' in item) {
            const name = (item as { name?: unknown }).name;
            if (typeof name === 'string') return [name];
            if (name && typeof name === 'object' && 'en' in name) {
              const english = (name as { en?: unknown }).en;
              if (typeof english === 'string') return [english];
            }
          }
          return [];
        });
        if (names.length) return [...new Set(names)];
      }
    }
    return mockCourseCategories;
  },
  async usage(id: string) {
    await requireUser(true);
    const db = readMockDb();
    const enrollmentIds = new Set(
      db.enrollments.filter((item) => item.courseId === id).map((item) => item.id),
    );
    return {
      enrollmentCount: enrollmentIds.size,
      paymentCount: db.payments.filter((item) => enrollmentIds.has(item.enrollmentId)).length,
    };
  },
  async list(options: CourseListAdminOptions = {}) {
    await requireUser();
    const {
      status = 'all',
      search = '',
      category = '',
      sort = 'newest',
      page = 1,
      pageSize = 10,
    } = options;
    const db = readMockDb();
    const items = db.courses.filter(
      (course) =>
        !course.deletedAt &&
        (status === 'all' || course.status === status) &&
        (!category || course.details.category === category) &&
        (!search ||
          `${course.details.title.ar} ${course.details.title.en} ${course.details.slug}`
            .toLowerCase()
            .includes(search.toLowerCase())),
    );
    items.sort((a, b) =>
      sort === 'title'
        ? a.details.title.en.localeCompare(b.details.title.en)
        : sort === 'oldest'
          ? a.updatedAt.localeCompare(b.updatedAt)
          : b.updatedAt.localeCompare(a.updatedAt),
    );
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize).map((course) => {
        const authorId = db.audit.find(
          (event) => event.entityId === course.id && event.action === 'course.created',
        )?.actorId;
        return {
          ...course,
          authorName: db.users.find((user) => user.id === authorId)?.name,
          hasPendingRevision: db.revisions.some(
            (revision) => revision.courseId === course.id && revision.status === 'pending_review',
          ),
        };
      }),
      total: items.length,
      page,
      pageSize,
      pageCount: Math.ceil(items.length / pageSize),
    };
  },
  async getById(id: string): Promise<CourseRecord> {
    await requireUser();
    const course = readMockDb().courses.find((item) => item.id === id && !item.deletedAt);
    if (!course) throw new CourseServiceError('not_found', 'Course not found');
    return course;
  },
  async checkSlug(slug: string, exceptId?: string): Promise<boolean> {
    await requireUser();
    return !readMockDb().courses.some(
      (course) =>
        course.id !== exceptId &&
        (course.details.slug === slug || course.slugHistory.includes(slug)),
    );
  },
  async createDraft(input: unknown, idempotencyKey?: string, template: CourseTemplateId = 'full'): Promise<CourseRecord> {
    const actor = await requireUser();
    const parsed = CourseDraftInputSchema.safeParse(input);
    if (!parsed.success) throw new CourseServiceError('validation', 'Course draft is invalid');
    const key = idempotencyKey?.trim();
    if (key && creationRequests.has(key)) return creationRequests.get(key)!;
    const pending = this.createDraftRecord(parsed.data, actor, template);
    if (key) creationRequests.set(key, pending);
    try {
      return await pending;
    } catch (error) {
      if (key) creationRequests.delete(key);
      throw error;
    }
  },
  async createDraftRecord(
    input: CourseDraftInput,
    actor: Awaited<ReturnType<typeof requireUser>>,
    template: CourseTemplateId = 'full',
  ): Promise<CourseRecord> {
    if (!(await this.categories()).includes(input.category))
      throw new CourseServiceError('validation', 'Choose a managed category');
    const db = readMockDb();
    if (
      db.courses.some(
        (course) => course.details.slug === input.slug || course.slugHistory.includes(input.slug),
      )
    )
      throw new CourseServiceError('slug_taken', 'Slug already exists');
    const payments = db.settings.values.payments;
    const currencyValue =
      typeof payments === 'object' && payments !== null
        ? (payments as Record<string, unknown>).defaultCurrency
        : undefined;
    const currency = ['EGP', 'USD', 'SAR', 'AED', 'EUR'].includes(String(currencyValue))
      ? (currencyValue as 'EGP' | 'USD' | 'SAR' | 'AED' | 'EUR')
      : 'EGP';
    const templatePage = courseTemplates[template]();
    const now = new Date().toISOString();
    const details = CourseDetailsSchema.parse({
      title: input.title,
      slug: input.slug,
      category: input.category,
      shortDescription: { ar: '', en: '' },
      featured: true,
      targetAudience: { ar: [], en: [] },
      instructor: { name: { ar: '', en: '' }, title: { ar: '', en: '' }, bio: { ar: [], en: [] } },
      coverImage: { src: '/images/course-cover-default.webp', alt: input.title },
      delivery: {
        method: 'online',
        location: { ar: '', en: '' },
        attendanceNotes: { ar: '', en: '' },
      },
      schedule: {
        startDate: '',
        endDate: '',
        scheduleText: { ar: '', en: '' },
        duration: { ar: '', en: '' },
      },
      pricing: {
        price: null,
        contactUs: false,
        currency,
        paymentInstructions: { ar: [], en: [] },
        paymentMethods: [],
      },
      enrollment: { registrationOpen: false, capacity: null, registrationDeadline: '' },
      accreditation: { verifiedByAcademy: false },
      requirements: { ar: [], en: [] },
      registrationForm: { fields: [] },
      contact: {},
      seo: {},
    });
    const course = CourseSchema.parse({
      id: crypto.randomUUID(),
      status: 'draft',
      publishedVersion: 0,
      slugHistory: [],
      createdAt: now,
      updatedAt: now,
      details,
      pageConfig: templatePage,
    });
    const revision = RevisionSchema.parse({
      id: crypto.randomUUID(),
      courseId: course.id,
      kind: 'new_course',
      status: 'draft',
      authorId: actor.id,
      baseVersion: 0,
      createdAt: now,
      snapshot: { details: course.details, pageConfig: course.pageConfig },
      summary: { detailsChanged: 0, sectionsChanged: templatePage.sections.length },
    });
    db.courses.unshift(course);
    db.revisions.unshift(revision);
    recordMockAudit(db, actor.id, 'course.created', course.id);
    writeMockDb(db);
    return course;
  },
  async saveDetails(
    courseId: string,
    input: { details: CourseDetails; baseVersion: number; baseUpdatedAt?: string },
  ) {
    const actor = await requireUser();
    if (consumeStaleSimulation())
      throw new CourseServiceError('stale', 'Course changed since editing began');
    const db = readMockDb();
    const course = db.courses.find((item) => item.id === courseId);
    if (!course) throw new CourseServiceError('not_found', 'Course not found');
    if (
      course.publishedVersion !== input.baseVersion ||
      (input.baseUpdatedAt && course.updatedAt !== input.baseUpdatedAt)
    )
      throw new CourseServiceError('stale', 'Course changed since editing began');
    const details = CourseDetailsSchema.parse(input.details);
    if (!mockCourseCategories.includes(details.category))
      throw new CourseServiceError('invalid', 'Choose a managed category');
    if (!(await this.checkSlug(details.slug, courseId)))
      throw new CourseServiceError('slug_taken', 'Slug already exists');
    if (
      actor.role !== 'admin' &&
      details.accreditation.verifiedByAcademy !== course.details.accreditation.verifiedByAcademy
    )
      throw new CourseServiceError('forbidden', 'Only Admin can verify accreditation');
    if (course.status === 'published')
      throw new CourseServiceError('invalid', 'Published details must be edited in a revision');
    if (details.slug !== course.details.slug) course.slugHistory.push(course.details.slug);
    course.details = details;
    course.updatedAt = new Date().toISOString();
    recordMockAudit(db, actor.id, 'course.details_saved', courseId);
    writeMockDb(db);
    return course;
  },
  async archive(id: string) {
    const actor = await requireUser(true);
    const db = readMockDb();
    const course = db.courses.find((item) => item.id === id);
    if (!course) throw new CourseServiceError('not_found', 'Course not found');
    course.status = 'archived';
    course.details.enrollment.registrationOpen = false;
    course.updatedAt = new Date().toISOString();
    recordMockAudit(db, actor.id, 'course.archived', id);
    writeMockDb(db);
  },
  async publishDirect(courseId: string) {
    const actor = await requireUser(true);
    const db = readMockDb();
    const course = db.courses.find((item) => item.id === courseId && !item.deletedAt);
    if (!course) throw new CourseServiceError('not_found', 'Course not found');
    const pending = db.revisions.find(
      (item) => item.courseId === courseId && item.status === 'pending_review',
    );
    if (pending)
      throw new CourseServiceError('pending_assistant_revision', 'Review the pending revision first');
    const draft = db.revisions.find(
      (item) => item.courseId === courseId && item.authorId === actor.id && ['draft', 'rejected'].includes(item.status),
    );
    const revisionSnapshot = draft?.snapshot ?? { details: course.details, pageConfig: course.pageConfig };
    const snapshot = course.publishedVersion === 0
      ? { details: course.details, pageConfig: revisionSnapshot.pageConfig }
      : revisionSnapshot;
    const readiness = checkReadiness(snapshot);
    if (readiness.errors.length)
      throw new CourseServiceError('readiness', 'Course readiness checks failed', readiness.errors);
    const now = new Date().toISOString();
    if (course.publishedVersion > 0) {
      db.revisions.unshift({
        id: crypto.randomUUID(), courseId, kind: 'update', status: 'approved',
        authorId: actor.id, reviewerId: actor.id, reviewedAt: now, baseVersion: course.publishedVersion,
        createdAt: now, snapshot: { details: course.details, pageConfig: course.pageConfig },
        summary: { detailsChanged: 0, sectionsChanged: 0 },
      });
    }
    if (draft) {
      draft.status = 'approved';
      draft.reviewerId = actor.id;
      draft.reviewedAt = now;
      draft.baseVersion = course.publishedVersion;
    } else {
      db.revisions.unshift({
        id: crypto.randomUUID(), courseId, kind: course.publishedVersion ? 'update' : 'new_course',
        status: 'approved', authorId: actor.id, reviewerId: actor.id, reviewedAt: now,
        baseVersion: course.publishedVersion, createdAt: now, snapshot,
        summary: { detailsChanged: 0, sectionsChanged: snapshot.pageConfig.sections.length },
      });
    }
    if (course.details.slug !== snapshot.details.slug) course.slugHistory.push(course.details.slug);
    course.details = snapshot.details;
    course.pageConfig = snapshot.pageConfig;
    course.status = 'published';
    course.publishedVersion += 1;
    course.updatedAt = now;
    recordMockAudit(db, actor.id, 'course.published_directly', courseId);
    writeMockDb(db);
    return course;
  },
  async unpublish(id: string) {
    const actor = await requireUser(true);
    const db = readMockDb();
    const course = db.courses.find((item) => item.id === id && !item.deletedAt);
    if (!course) throw new CourseServiceError('not_found', 'Course not found');
    if (course.status !== 'published') throw new CourseServiceError('invalid', 'Only published courses can be unpublished');
    course.status = 'draft';
    course.details.enrollment.registrationOpen = false;
    course.updatedAt = new Date().toISOString();
    recordMockAudit(db, actor.id, 'course.unpublished', id);
    writeMockDb(db);
    return course;
  },
  async unarchive(id: string) {
    const actor = await requireUser(true);
    const db = readMockDb();
    const course = db.courses.find((item) => item.id === id);
    if (!course) throw new CourseServiceError('not_found', 'Course not found');
    course.status = course.publishedVersion ? 'published' : 'draft';
    course.updatedAt = new Date().toISOString();
    recordMockAudit(db, actor.id, 'course.unarchived', id);
    writeMockDb(db);
  },
  async remove(id: string) {
    const actor = await requireUser(true);
    const db = readMockDb();
    const course = db.courses.find((item) => item.id === id);
    if (!course) throw new CourseServiceError('not_found', 'Course not found');
    const enrollmentIds = new Set(
      db.enrollments.filter((item) => item.courseId === id).map((item) => item.id),
    );
    const enrollmentCount = enrollmentIds.size;
    const paymentCount = db.payments.filter((item) => enrollmentIds.has(item.enrollmentId)).length;
    const softDeleted = enrollmentCount > 0 || paymentCount > 0;
    if (softDeleted) {
      course.deletedAt = new Date().toISOString();
    } else {
      db.courses = db.courses.filter((item) => item.id !== id);
      db.revisions = db.revisions.filter((item) => item.courseId !== id);
    }
    recordMockAudit(db, actor.id, 'course.deleted', id, {
      softDeleted,
      enrollmentCount,
      paymentCount,
    });
    writeMockDb(db);
    return { softDeleted, enrollmentCount, paymentCount };
  },
};
