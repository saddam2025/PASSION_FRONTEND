import {
  CourseSchema,
  SnapshotSchema,
  type Course,
  type CourseStatus,
  type Snapshot,
} from '@/schemas/course';
import { CourseDraftInputSchema, reservedSlugs } from '@/schemas/courseDraft';
import { checkReadiness } from '@/schemas/courseReadiness';
import { mockAuthService } from '@/services/auth.mock';
import type { AuthUser } from '@/services/auth.types';
import type { AuditAction } from '@/schemas/audit';
import type { NotificationType } from '@/services/notifications';
import { readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import { readCourses, writeCourses } from './storage';
import { hasUnpublishedChanges } from './hash';
import { createTemplatePageConfig } from './templates';
import type {
  CourseListItem,
  CourseListFilters,
  CourseListResponse,
  CourseStatusCounts,
  CreateCourseInput,
  Result,
} from './types';

async function getActor(): Promise<AuthUser | null> {
  try {
    return await mockAuthService.getCurrentUser();
  } catch {
    return null;
  }
}

const courseSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function recordTransition(
  actorId: string,
  courseId: string,
  action: AuditAction,
  notification?: { type: NotificationType; recipientRole: 'admin' | 'assistant'; recipientId?: string },
): void {
  const db = readMockDb();
  recordMockAudit(db, actorId, action, courseId);
  if (notification) db.notifications.unshift({
    id: crypto.randomUUID(),
    type: notification.type,
    entityId: courseId,
    courseId,
    recipientRole: notification.recipientRole,
    ...(notification.recipientId ? { recipientId: notification.recipientId } : {}),
    createdAt: new Date().toISOString(),
    readAt: null,
  });
  writeMockDb(db);
}

export const coursesService = {
  async listPendingReview(): Promise<Result<Course[]>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') return { ok: false, code: 'FORBIDDEN', message: 'المراجعات متاحة للإدارة بس.' };
    return { ok: true, data: readCourses().filter((course) => !course.deletedAt && course.review.state === 'pending') };
  },
  async listPendingDeletion(): Promise<Result<Course[]>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') return { ok: false, code: 'FORBIDDEN', message: 'طلبات الحذف متاحة للإدارة بس.' };
    return { ok: true, data: readCourses().filter((course) => !course.deletedAt && course.deletionRequest) };
  },
  /**
   * List courses for dashboard management with filtering, search, pagination, and status counts.
   */
  async list(filters: CourseListFilters = {}): Promise<Result<CourseListResponse>> {
    const actor = await getActor();
    if (!actor) {
      return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' };
    }

    const {
      status = 'all',
      search = '',
      category = '',
      sort = 'newest',
      page = 1,
      pageSize = 10,
    } = filters;

    const allCourses = readCourses().filter((c) => !c.deletedAt);
    const db = readMockDb();
    const userMap = new Map(db.users.map((u) => [u.id, u.name]));

    // Compute status counts across all undeleted courses
    const counts: CourseStatusCounts = {
      all: allCourses.length,
      published: 0,
      draft: 0,
      pending_review: 0,
      rejected: 0,
      archived: 0,
      unpublished_changes: 0,
    };

    for (const c of allCourses) {
      if (c.status === 'published') {
        counts.published++;
        if (hasUnpublishedChanges(c)) {
          counts.unpublished_changes++;
        }
        if (c.review.state === 'pending') counts.pending_review++;
        if (c.review.state === 'rejected') counts.rejected++;
      } else if (c.status === 'archived') {
        counts.archived++;
        if (c.review.state === 'pending') counts.pending_review++;
        if (c.review.state === 'rejected') counts.rejected++;
      } else if (c.status === 'draft') {
        if (c.review.state === 'pending') {
          counts.pending_review++;
        } else if (c.review.state === 'rejected') {
          counts.rejected++;
        } else {
          counts.draft++;
        }
      }
    }

    // Filter courses
    const filtered = allCourses.filter((course) => {
      // الحالة filtering
      if (status !== 'all') {
        if (status === 'draft') {
          if (course.status !== 'draft' || course.review.state === 'pending' || course.review.state === 'rejected') {
            return false;
          }
        } else if (course.status !== status) {
          return false;
        }
      }

      // Review state filter if explicitly given
      if (filters.reviewState && course.review.state !== filters.reviewState) {
        return false;
      }

      // تعديلات مش منشورة filter if given
      if (filters.hasUnpublishedChanges && !hasUnpublishedChanges(course)) {
        return false;
      }

      // التصنيف filter
      if (category && course.draft.details.category !== category) {
        return false;
      }

      // Search Arabic title, slug, and category.
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const titleAr = course.draft.details.title.ar.toLowerCase();
        const slug = course.slug.toLowerCase();
        const cat = course.draft.details.category.toLowerCase();
        if (
          !titleAr.includes(query) &&
          !slug.includes(query) &&
          !cat.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort courses
    filtered.sort((a, b) => {
      if (sort === 'title') {
        return a.draft.details.title.ar.localeCompare(b.draft.details.title.ar);
      }
      if (sort === 'oldest') {
        return a.updatedAt.localeCompare(b.updatedAt);
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });

    const total = filtered.length;
    const pageIndex = Math.max(1, page);
    const startIndex = (pageIndex - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    const items: CourseListItem[] = paginatedItems.map((course) => {
      const authorName = userMap.get(course.createdBy);
      return {
        id: course.id,
        slug: course.slug,
        status: course.status,
        reviewState: course.review.state,
        hasUnpublishedChanges: hasUnpublishedChanges(course),
        featured: course.featured,
        title: course.draft.details.title,
        ...(course.published ? { publishedTitle: course.published.details.title } : {}),
        ...(course.published?.details.whatsappOverrides?.number
          ? { publishedWhatsappNumber: course.published.details.whatsappOverrides.number }
          : {}),
        category: course.draft.details.category,
        coverImage: {
          src: course.draft.details.coverImage.src,
          alt: course.draft.details.coverImage.alt,
        },
        authorId: course.createdBy,
        authorName,
        updatedAt: course.updatedAt,
        createdAt: course.createdAt,
        version: course.version,
        publishedVersion: course.publishedVersion,
        reviewReason: course.review.reason,
        ...(course.deletionRequest ? { deletionRequest: course.deletionRequest } : {}),
        ...(course.deletionRequestRejection ? { deletionRequestRejection: course.deletionRequestRejection } : {}),
        enrollmentCount: db.enrollments.filter((item) => item.courseId === course.id).length,
        paymentCount: db.payments.filter((payment) => db.enrollments.some((item) => item.id === payment.enrollmentId && item.courseId === course.id)).length,
      };
    });

    return {
      ok: true,
      data: {
        items,
        total,
        page: pageIndex,
        pageSize,
        pageCount: Math.ceil(total / pageSize) || 1,
        counts,
      },
    };
  },

  /**
   * Get single course by ID.
   */
  async get(id: string): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor) {
      return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' };
    }

    const course = readCourses().find((c) => c.id === id && !c.deletedAt);
    if (!course) {
      return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    }

    return { ok: true, data: course };
  },

  /**
   * Create a new course draft. Both Admin and Assistant can create.
   */
  async create(input: CreateCourseInput): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor) {
      return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' };
    }

    const validation = CourseDraftInputSchema.safeParse(input);
    if (!validation.success) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: validation.error.errors[0]?.message || 'راجع بيانات الكورس وحاول تاني.',
        details: validation.error.format(),
      };
    }

    const courses = readCourses();
    const existing = courses.find((c) => c.slug === input.slug || c.slugHistory.includes(input.slug));
    if (existing) {
      return { ok: false, code: 'SLUG_TAKEN', message: 'الرابط مستخدم بالفعل.' };
    }

    const templatePage = createTemplatePageConfig(input.template || 'full', input.title);
    const now = new Date().toISOString();

    const snapshot: Snapshot = {
      details: {
        title: input.title,
        shortDescription: { ar: '', en: '' },
        category: input.category,
        instructor: {
          name: { ar: '', en: '' },
          title: { ar: '', en: '' },
        },
        coverImage: {
          src: '/images/course-cover-default.webp',
          alt: input.title,
          decorative: false,
        },
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
          promo: null,
          currency: 'EGP',
        },
        enrollment: {
          registrationOpen: false,
          capacity: null,
        },
        accreditation: {
          text: { ar: '', en: '' },
          verifiedByAcademy: false,
        },
        whatsappOverrides: {
          number: '',
          messageTemplate: { ar: '', en: '' },
        },
      },
      page: templatePage,
      form: { fields: [] },
      seo: {
        title: input.title,
        description: { ar: '', en: '' },
      },
    };

    const newCourse: Course = {
      id: crypto.randomUUID(),
      slug: input.slug,
      slugHistory: [],
      status: 'draft',
      featured: false,
      createdBy: actor.id,
      createdAt: now,
      updatedAt: now,
      version: 1,
      publishedVersion: 0,
      published: null,
      draft: snapshot,
      review: { state: 'none' },
      versions: [],
    };

    const parsed = CourseSchema.safeParse(newCourse);
    if (!parsed.success) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'ما قدرناش نجهّز بيانات الكورس. راجع المدخلات وحاول تاني.',
        details: parsed.error.format(),
      };
    }

    courses.unshift(parsed.data);
    writeCourses(courses);

    return { ok: true, data: parsed.data };
  },

  /**
   * احفظ كمسودة snapshot with optimistic concurrency check.
   */
  async saveDraft(
    id: string,
    snapshot: Snapshot,
    expectedVersion?: number,
  ): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor) {
      return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' };
    }

    const parsedSnapshot = SnapshotSchema.safeParse(snapshot);
    if (!parsedSnapshot.success) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'بيانات الكورس مش صحيحة. راجع المدخلات وحاول تاني.',
        details: parsedSnapshot.error.format(),
      };
    }

    const courses = readCourses();
    const index = courses.findIndex((c) => c.id === id && !c.deletedAt);
    if (index === -1) {
      return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    }

    const course = courses[index];

    const requestedSlug = parsedSnapshot.data.details.slug?.trim().toLowerCase();
    if (requestedSlug && requestedSlug !== course.slug) {
      if (!courseSlugPattern.test(requestedSlug) || requestedSlug.length < 3 || requestedSlug.length > 80 || reservedSlugs.has(requestedSlug)) {
        return { ok: false, code: 'VALIDATION_ERROR', message: 'الرابط المختصر مش صالح أو محجوز.' };
      }
      if (courses.some((item) => item.id !== id && (item.slug === requestedSlug || item.slugHistory.includes(requestedSlug)))) {
        return { ok: false, code: 'SLUG_TAKEN', message: 'الرابط المختصر مستخدم بالفعل.' };
      }
    }
    if (actor.role === 'assistant' && parsedSnapshot.data.details.accreditation.verifiedByAcademy !== course.draft.details.accreditation.verifiedByAcademy) {
      return { ok: false, code: 'FORBIDDEN', message: 'تأكيد الاعتماد متاح للإدارة فقط.' };
    }

    if (actor.role === 'assistant' && course.review.state === 'pending') {
      return { ok: false, code: 'REVIEW_PENDING', message: 'الكورس في انتظار المراجعة. اسحب الطلب الأول عشان تعدّل.' };
    }

    // Optimistic concurrency check
    if (expectedVersion !== undefined && course.version !== expectedVersion) {
      return {
        ok: false,
        code: 'CONCURRENCY_CONFLICT',
        message: 'الكورس اتحدّث في مكان تاني. حدّث الصفحة وجرّب تاني.',
      };
    }

    const updatedCourse: Course = {
      ...course,
      ...(requestedSlug && requestedSlug !== course.slug
        ? { slug: requestedSlug, slugHistory: [...new Set([...course.slugHistory, course.slug])] }
        : {}),
      draft: parsedSnapshot.data,
      version: course.version + 1,
      updatedAt: new Date().toISOString(),
    };

    courses[index] = updatedCourse;
    writeCourses(courses);

    return { ok: true, data: updatedCourse };
  },

  /**
   * Admin publish: validate readiness, copy draft -> published, push to versions,
   * publishedVersion++, status 'published', review.state 'none'.
   */
  async publish(id: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'النشر المباشر متاح للإدارة بس.',
      };
    }

    const courses = readCourses();
    const index = courses.findIndex((c) => c.id === id && !c.deletedAt);
    if (index === -1) {
      return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    }

    const course = courses[index];
    if (course.status === 'archived') {
      return { ok: false, code: 'INVALID_TRANSITION', message: 'ما ينفعش تنشر كورس مؤرشف. ألغِ الأرشفة الأول.' };
    }
    if (expectedVersion !== undefined && course.version !== expectedVersion) {
      return {
        ok: false,
        code: 'CONCURRENCY_CONFLICT',
        message: 'الكورس اتغير. حدّث الصفحة قبل النشر.',
      };
    }

    // Validate readiness
    const readiness = checkReadiness({
      details: course.draft.details,
      pageConfig: course.draft.page,
      form: course.draft.form,
    }, course.slug);
    if (readiness.errors.length > 0) {
      return {
        ok: false,
        code: 'READINESS_FAILED',
        message: 'الكورس مش جاهز للنشر. راجع البيانات المطلوبة.',
        details: readiness.errors,
      };
    }

    const now = new Date().toISOString();
    const nextPublishedVersion = course.publishedVersion + 1;

    const versionRecord = {
      version: nextPublishedVersion,
      snapshot: course.draft,
      publishedBy: actor.id,
      publishedAt: now,
    };

    const newVersions = [versionRecord, ...course.versions].slice(0, 20);

    const publishedCourse: Course = {
      ...course,
      status: 'published',
      published: course.draft,
      publishedVersion: nextPublishedVersion,
      version: course.version + 1,
      updatedAt: now,
      review: course.review.state === 'pending'
        ? { state: 'none', reviewedBy: actor.id, reviewedAt: now, submittedBy: course.review.submittedBy, submittedAt: course.review.submittedAt }
        : { state: 'none' },
      versions: newVersions,
    };

    courses[index] = publishedCourse;
    writeCourses(courses);
    recordTransition(actor.id, id, course.review.state === 'pending' ? 'revision.approved' : 'course.published_directly', course.review.state === 'pending'
      ? { type: 'revision_approved', recipientRole: 'assistant', recipientId: course.review.submittedBy ?? course.createdBy }
      : { type: 'course_published', recipientRole: 'assistant', recipientId: course.createdBy });

    return { ok: true, data: publishedCourse };
  },

  /**
   * Assistant submit for review: submit -> review.pending; live version never changes.
   */
  async submit(id: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor) {
      return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' };
    }
    if (actor.role !== 'assistant') return { ok: false, code: 'FORBIDDEN', message: 'المراجعة مخصصة لمساعد الأكاديمية.' };

    const courses = readCourses();
    const index = courses.findIndex((c) => c.id === id && !c.deletedAt);
    if (index === -1) {
      return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    }

    const course = courses[index];
    if (course.review.state === 'pending') return { ok: false, code: 'INVALID_TRANSITION', message: 'الكورس اتبعت للمراجعة بالفعل.' };
    if (expectedVersion !== undefined && course.version !== expectedVersion) {
      return {
        ok: false,
        code: 'CONCURRENCY_CONFLICT',
        message: 'الكورس اتحدّث. حدّث الصفحة قبل ما تبعته للمراجعة.',
      };
    }

    const readiness = checkReadiness({
      details: course.draft.details,
      pageConfig: course.draft.page,
      form: course.draft.form,
    }, course.slug);
    if (readiness.errors.length > 0) {
      return {
        ok: false,
        code: 'READINESS_FAILED',
        message: 'الكورس مش جاهز للإرسال. راجع الحقول المطلوبة.',
        details: readiness.errors,
      };
    }

    const now = new Date().toISOString();
    const updated: Course = {
      ...course,
      version: course.version + 1,
      updatedAt: now,
      review: {
        state: 'pending',
        submittedBy: actor.id,
        submittedAt: now,
      },
    };

    courses[index] = updated;
    writeCourses(courses);
    recordTransition(actor.id, id, 'revision.submitted', { type: 'course_submitted', recipientRole: 'admin' });

    return { ok: true, data: updated };
  },

  /**
   * Admin approve of a pending submission = same as publish.
   */
  async approve(id: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'اعتماد الطلبات متاح للإدارة بس.',
      };
    }
    const course = readCourses().find((item) => item.id === id && !item.deletedAt);
    if (!course) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    if (course.review.state !== 'pending') return { ok: false, code: 'INVALID_TRANSITION', message: 'الكورس مش في انتظار المراجعة.' };
    return this.publish(id, expectedVersion);
  },

  async withdraw(id: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'assistant') return { ok: false, code: 'FORBIDDEN', message: 'سحب الطلب متاح لمساعد الأكاديمية.' };
    const courses = readCourses();
    const index = courses.findIndex((item) => item.id === id && !item.deletedAt);
    if (index < 0) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    const course = courses[index];
    if (course.review.state !== 'pending') return { ok: false, code: 'INVALID_TRANSITION', message: 'مفيش طلب مراجعة مفتوح لسحبه.' };
    if (course.review.submittedBy !== actor.id) return { ok: false, code: 'FORBIDDEN', message: 'تقدر تسحب الطلب اللي بعته بس.' };
    if (expectedVersion !== undefined && course.version !== expectedVersion) return { ok: false, code: 'CONCURRENCY_CONFLICT', message: 'الكورس اتحدّث. حدّث الصفحة وجرّب تاني.' };
    const updated: Course = { ...course, review: { state: 'none' }, version: course.version + 1, updatedAt: new Date().toISOString() };
    courses[index] = updated;
    writeCourses(courses);
    recordTransition(actor.id, id, 'revision.reopened', { type: 'course_withdrawn', recipientRole: 'admin' });
    return { ok: true, data: updated };
  },

  /**
   * Admin reject: reject -> review.rejected + reason, draft is kept.
   */
  async reject(id: string, reason: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'رفض الطلبات متاح للإدارة بس.',
      };
    }

    if (!reason || !reason.trim()) {
      return {
        ok: false,
        code: 'REASON_REQUIRED',
        message: 'اكتب سبب الرفض.',
      };
    }
    if (reason.trim().length < 10 || reason.trim().length > 1000) return { ok: false, code: 'REASON_REQUIRED', message: 'اكتب سبب الرفض من 10 لـ1000 حرف.' };

    const courses = readCourses();
    const index = courses.findIndex((c) => c.id === id && !c.deletedAt);
    if (index === -1) {
      return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    }

    const course = courses[index];
    if (course.review.state !== 'pending') return { ok: false, code: 'INVALID_TRANSITION', message: 'الكورس مش في انتظار المراجعة.' };
    if (expectedVersion !== undefined && course.version !== expectedVersion) {
      return {
        ok: false,
        code: 'CONCURRENCY_CONFLICT',
        message: 'الكورس اتحدّث. حدّث الصفحة وجرّب تاني.',
      };
    }

    const now = new Date().toISOString();
    const updated: Course = {
      ...course,
      version: course.version + 1,
      updatedAt: now,
      review: {
        state: 'rejected',
        submittedBy: course.review.submittedBy,
        submittedAt: course.review.submittedAt,
        reviewedBy: actor.id,
        reviewedAt: now,
        reason: reason.trim(),
      },
    };

    courses[index] = updated;
    writeCourses(courses);
    recordTransition(actor.id, id, 'revision.rejected', { type: 'revision_rejected', recipientRole: 'assistant', recipientId: course.review.submittedBy ?? course.createdBy });

    return { ok: true, data: updated };
  },

  /**
   * Admin unpublish: status 'draft' (hidden, registration closed, snapshots kept).
   */
  async unpublish(id: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'إلغاء النشر متاح للإدارة بس.',
      };
    }

    const courses = readCourses();
    const index = courses.findIndex((c) => c.id === id && !c.deletedAt);
    if (index === -1) {
      return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    }

    const course = courses[index];
    if (course.status !== 'published') return { ok: false, code: 'INVALID_TRANSITION', message: 'الكورس مش منشور دلوقتي.' };
    if (expectedVersion !== undefined && course.version !== expectedVersion) {
      return {
        ok: false,
        code: 'CONCURRENCY_CONFLICT',
        message: 'الكورس اتحدّث. حدّث الصفحة قبل ما تجرّب تاني.',
      };
    }

    const now = new Date().toISOString();
    // Close registration in draft as well
    const draftWithClosedRegistration: Snapshot = {
      ...course.draft,
      details: {
        ...course.draft.details,
        enrollment: {
          ...course.draft.details.enrollment,
          registrationOpen: false,
        },
      },
    };

    const updated: Course = {
      ...course,
      status: 'draft',
      draft: draftWithClosedRegistration,
      version: course.version + 1,
      updatedAt: now,
    };

    courses[index] = updated;
    writeCourses(courses);
    recordTransition(actor.id, id, 'course.unpublished', { type: 'course_unpublished', recipientRole: 'assistant', recipientId: course.createdBy });

    return { ok: true, data: updated };
  },

  /**
   * Admin archive course.
   */
  async archive(id: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'أرشفة الكورسات متاحة للإدارة بس.',
      };
    }

    const courses = readCourses();
    const index = courses.findIndex((c) => c.id === id && !c.deletedAt);
    if (index === -1) {
      return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    }

    const course = courses[index];
    if (expectedVersion !== undefined && course.version !== expectedVersion) {
      return {
        ok: false,
        code: 'CONCURRENCY_CONFLICT',
        message: 'الكورس اتحدّث. حدّث الصفحة قبل ما تجرّب تاني.',
      };
    }

    const now = new Date().toISOString();
    const updated: Course = {
      ...course,
      status: 'archived',
      draft: {
        ...course.draft,
        details: {
          ...course.draft.details,
          enrollment: {
            ...course.draft.details.enrollment,
            registrationOpen: false,
          },
        },
      },
      version: course.version + 1,
      updatedAt: now,
    };

    courses[index] = updated;
    writeCourses(courses);

    return { ok: true, data: updated };
  },

  /**
   * Admin unarchive course.
   */
  async unarchive(id: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'إلغاء الأرشفة متاح للإدارة بس.',
      };
    }

    const courses = readCourses();
    const index = courses.findIndex((c) => c.id === id && !c.deletedAt);
    if (index === -1) {
      return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    }

    const course = courses[index];
    if (expectedVersion !== undefined && course.version !== expectedVersion) {
      return {
        ok: false,
        code: 'CONCURRENCY_CONFLICT',
        message: 'الكورس اتحدّث. حدّث الصفحة قبل ما تجرّب تاني.',
      };
    }

    const now = new Date().toISOString();
    const restoredStatus: CourseStatus = course.publishedVersion > 0 ? 'published' : 'draft';

    const updated: Course = {
      ...course,
      status: restoredStatus,
      version: course.version + 1,
      updatedAt: now,
    };

    courses[index] = updated;
    writeCourses(courses);

    return { ok: true, data: updated };
  },

  /**
   * Admin direct deletion. Course records are always soft-deleted so the slug stays reserved.
   */
  async remove(id: string): Promise<Result<{ softDeleted: boolean }>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'حذف الكورسات متاح للإدارة بس.',
      };
    }

    const courses = readCourses();
    const index = courses.findIndex((c) => c.id === id && !c.deletedAt);
    if (index === -1) {
      return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    }

    const now = new Date().toISOString();
    const course = courses[index];
    const closeRegistration = (snapshot: Snapshot): Snapshot => ({
      ...snapshot,
      details: { ...snapshot.details, enrollment: { ...snapshot.details.enrollment, registrationOpen: false } },
    });
    courses[index] = {
      ...course,
      deletedAt: now,
      updatedAt: now,
      version: course.version + 1,
      draft: closeRegistration(course.draft),
      published: course.published ? closeRegistration(course.published) : null,
    };
    writeCourses(courses);
    recordTransition(actor.id, id, 'course.deleted');
    return { ok: true, data: { softDeleted: true } };
  },

  async requestDeletion(id: string, reason: string): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'assistant') return { ok: false, code: 'FORBIDDEN', message: 'طلب حذف الكورس متاح لمساعد الأكاديمية.' };
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 10 || normalizedReason.length > 1000) return { ok: false, code: 'REASON_REQUIRED', message: 'اكتب سبب طلب الحذف من 10 لـ1000 حرف.' };
    const courses = readCourses();
    const index = courses.findIndex((course) => course.id === id && !course.deletedAt);
    if (index < 0) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    const course = courses[index];
    if (course.deletionRequest) return { ok: false, code: 'INVALID_TRANSITION', message: 'فيه طلب حذف مفتوح للكورس ده بالفعل.' };
    const now = new Date().toISOString();
    const updated: Course = {
      ...course,
      deletionRequest: { requestedBy: actor.id, requestedAt: now, reason: normalizedReason },
      version: course.version + 1,
      updatedAt: now,
    };
    delete updated.deletionRequestRejection;
    courses[index] = updated;
    writeCourses(courses);
    recordTransition(actor.id, id, 'course.deletion_requested', { type: 'course_deletion_requested', recipientRole: 'admin' });
    return { ok: true, data: updated };
  },

  async cancelDeletionRequest(id: string): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'assistant') return { ok: false, code: 'FORBIDDEN', message: 'إلغاء طلب الحذف متاح لمساعد الأكاديمية.' };
    const courses = readCourses();
    const index = courses.findIndex((course) => course.id === id && !course.deletedAt);
    if (index < 0) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    const course = courses[index];
    if (!course.deletionRequest) return { ok: false, code: 'INVALID_TRANSITION', message: 'مفيش طلب حذف مفتوح لإلغائه.' };
    if (course.deletionRequest.requestedBy !== actor.id) return { ok: false, code: 'FORBIDDEN', message: 'تقدر تلغي طلب الحذف اللي قدمته بس.' };
    const updated: Course = { ...course, version: course.version + 1, updatedAt: new Date().toISOString() };
    delete updated.deletionRequest;
    courses[index] = updated;
    writeCourses(courses);
    recordTransition(actor.id, id, 'course.deletion_request_cancelled');
    return { ok: true, data: updated };
  },

  async approveDeletion(id: string): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') return { ok: false, code: 'FORBIDDEN', message: 'اعتماد طلب الحذف متاح للإدارة بس.' };
    const courses = readCourses();
    const index = courses.findIndex((course) => course.id === id && !course.deletedAt);
    if (index < 0) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    const course = courses[index];
    if (!course.deletionRequest) return { ok: false, code: 'INVALID_TRANSITION', message: 'مفيش طلب حذف مفتوح لاعتماده.' };
    const now = new Date().toISOString();
    const closeRegistration = (snapshot: Snapshot): Snapshot => ({
      ...snapshot,
      details: { ...snapshot.details, enrollment: { ...snapshot.details.enrollment, registrationOpen: false } },
    });
    const request = course.deletionRequest;
    const deleted: Course = {
      ...course,
      deletedAt: now,
      updatedAt: now,
      version: course.version + 1,
      draft: closeRegistration(course.draft),
      published: course.published ? closeRegistration(course.published) : null,
    };
    delete deleted.deletionRequest;
    courses[index] = deleted;
    writeCourses(courses);
    recordTransition(actor.id, id, 'course.deletion_approved', { type: 'course_deletion_approved', recipientRole: 'assistant', recipientId: request.requestedBy });
    recordTransition(actor.id, id, 'course.deleted');
    return { ok: true, data: deleted };
  },

  async rejectDeletion(id: string, reason: string): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') return { ok: false, code: 'FORBIDDEN', message: 'رفض طلب الحذف متاح للإدارة بس.' };
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 10 || normalizedReason.length > 1000) return { ok: false, code: 'REASON_REQUIRED', message: 'اكتب سبب الرفض من 10 لـ1000 حرف.' };
    const courses = readCourses();
    const index = courses.findIndex((course) => course.id === id && !course.deletedAt);
    if (index < 0) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    const course = courses[index];
    if (!course.deletionRequest) return { ok: false, code: 'INVALID_TRANSITION', message: 'مفيش طلب حذف مفتوح لرفضه.' };
    const request = course.deletionRequest;
    const now = new Date().toISOString();
    const updated: Course = {
      ...course,
      deletionRequestRejection: { rejectedBy: actor.id, rejectedAt: now, reason: normalizedReason },
      version: course.version + 1,
      updatedAt: now,
    };
    delete updated.deletionRequest;
    courses[index] = updated;
    writeCourses(courses);
    recordTransition(actor.id, id, 'course.deletion_request_rejected', { type: 'course_deletion_rejected', recipientRole: 'assistant', recipientId: request.requestedBy });
    return { ok: true, data: updated };
  },

  /**
   * Rollback: load an old version into draft, then publish. Admin only.
   */
  async rollback(id: string, targetVersion: number): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor || actor.role !== 'admin') {
      return {
        ok: false,
        code: 'FORBIDDEN',
        message: 'استعادة الإصدارات متاحة للإدارة بس.',
      };
    }

    const courses = readCourses();
    const index = courses.findIndex((c) => c.id === id && !c.deletedAt);
    if (index === -1) {
      return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    }

    const course = courses[index];
    const target = course.versions.find((v) => v.version === targetVersion);
    if (!target) {
      return { ok: false, code: 'NOT_FOUND', message: 'الإصدار المطلوب مش موجود.' };
    }

    // Set draft to target snapshot, then publish
    const now = new Date().toISOString();
    const nextPublishedVersion = course.publishedVersion + 1;

    const versionRecord = {
      version: nextPublishedVersion,
      snapshot: target.snapshot,
      publishedBy: actor.id,
      publishedAt: now,
    };

    const updated: Course = {
      ...course,
      status: 'published',
      draft: target.snapshot,
      published: target.snapshot,
      publishedVersion: nextPublishedVersion,
      version: course.version + 1,
      updatedAt: now,
      review: { state: 'none' },
      versions: [versionRecord, ...course.versions].slice(0, 20),
    };

    courses[index] = updated;
    writeCourses(courses);

    return { ok: true, data: updated };
  },

  /**
   * Check whether a slug is available.
   */
  async checkSlug(slug: string, exceptId?: string): Promise<Result<boolean>> {
    if (!slug || slug.length < 3 || slug.length > 80 || !courseSlugPattern.test(slug) || reservedSlugs.has(slug)) {
      return { ok: true, data: false };
    }

    const courses = readCourses();
    const taken = courses.some(
      (c) =>
        c.id !== exceptId &&
        (c.slug === slug || c.slugHistory.includes(slug)),
    );

    return { ok: true, data: !taken };
  },

  /**
   * Get version history for a course.
   */
  async history(id: string): Promise<Result<Course['versions']>> {
    const actor = await getActor();
    if (!actor) {
      return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' };
    }

    const course = readCourses().find((c) => c.id === id && !c.deletedAt);
    if (!course) {
      return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    }

    return { ok: true, data: course.versions };
  },

  /**
   * Public: get published course by slug.
   * Reads ONLY course.published, and ONLY when status === 'published'.
   */
  async getPublishedBySlug(slug: string): Promise<Result<Course>> {
    const courses = readCourses();
    const course = courses.find(
      (c) =>
        !c.deletedAt &&
        c.status === 'published' &&
        c.published !== null &&
        (c.slug === slug || c.slugHistory.includes(slug)),
    );

    if (!course) {
      return { ok: false, code: 'NOT_FOUND', message: 'الكورس ده مش متاح دلوقتي.' };
    }

    return { ok: true, data: course };
  },

  /**
   * Public: list all published courses.
   */
  async listPublished(): Promise<Result<Course[]>> {
    const courses = readCourses();
    const published = courses.filter(
      (c) => !c.deletedAt && c.status === 'published' && c.published !== null,
    );
    return { ok: true, data: published };
  },
};
