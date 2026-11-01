import { CourseSchema, SnapshotSchema, type Course, type Snapshot } from '@/schemas/course';
import { CourseDraftInputSchema, reservedSlugs } from '@/schemas/courseDraft';
import { checkReadiness } from '@/schemas/courseReadiness';
import { mockAuthService } from '@/services/auth.mock';
import type { AuthUser } from '@/services/auth.types';
import { readMockDb } from '@/mocks/db';
import { readCourses, writeCourses } from './storage';
import { hasUnpublishedChanges } from './hash';
import { createTemplatePageConfig } from './templates';
import type { CourseListItem, CourseListFilters, CourseListResponse, CourseStatusCounts, CreateCourseInput, Result } from './types';

async function getActor(): Promise<AuthUser | null> {
  try { return await mockAuthService.getCurrentUser(); } catch { return null; }
}
const courseSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const forbidden = <T,>(): Result<T> => ({ ok: false, code: 'FORBIDDEN', message: 'الخدمة دي متاحة لمدير الأكاديمية بس.' });

export const coursesService = {
  async list(filters: CourseListFilters = {}): Promise<Result<CourseListResponse>> {
    const actor = await getActor();
    if (!actor) return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' };
    if (actor.role !== 'admin') return forbidden();
    const { status = 'all', search = '', category = '', sort = 'newest', page = 1, pageSize = 10 } = filters;
    const all = readCourses().filter((course) => !course.deletedAt);
    const counts: CourseStatusCounts = { all: all.length, published: 0, draft: 0, archived: 0, unpublished_changes: 0 };
    for (const course of all) { counts[course.status]++; if (course.status === 'published' && hasUnpublishedChanges(course)) counts.unpublished_changes++; }
    const query = search.trim().toLocaleLowerCase();
    const filtered = all.filter((course) => (status === 'all' || course.status === status)
      && (!filters.hasUnpublishedChanges || hasUnpublishedChanges(course))
      && (!category || course.draft.details.category === category)
      && (!query || course.draft.details.title.ar.toLocaleLowerCase().includes(query) || course.slug.includes(query) || course.draft.details.category.toLocaleLowerCase().includes(query)));
    filtered.sort((a,b) => sort === 'title' ? a.draft.details.title.ar.localeCompare(b.draft.details.title.ar) : sort === 'oldest' ? a.updatedAt.localeCompare(b.updatedAt) : b.updatedAt.localeCompare(a.updatedAt));
    const currentPage = Math.max(1, page); const currentSize = Math.max(1, Math.min(100, pageSize));
    const db = readMockDb();
    const items: CourseListItem[] = filtered.slice((currentPage - 1) * currentSize, currentPage * currentSize).map((course) => {
      const enrollments = db.enrollments.filter((item) => item.courseId === course.id);
      return { id: course.id, slug: course.slug, status: course.status, hasUnpublishedChanges: hasUnpublishedChanges(course), featured: course.featured, title: course.draft.details.title, ...(course.published ? { publishedTitle: course.published.details.title } : {}), ...(course.published?.details.whatsappOverrides?.number ? { publishedWhatsappNumber: course.published.details.whatsappOverrides.number } : {}), category: course.draft.details.category, coverImage: course.draft.details.coverImage, createdAt: course.createdAt, updatedAt: course.updatedAt, version: course.version, enrollmentCount: enrollments.length, paymentCount: db.payments.filter((payment) => enrollments.some((item) => item.id === payment.enrollmentId)).length };
    });
    return { ok: true, data: { items, total: filtered.length, page: currentPage, pageSize: currentSize, pageCount: Math.ceil(filtered.length / currentSize) || 1, counts } };
  },

  async get(id: string): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor) return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' };
    if (actor.role !== 'admin') return forbidden();
    const course = readCourses().find((item) => item.id === id && !item.deletedAt);
    return course ? { ok: true, data: course } : { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
  },

  async create(input: CreateCourseInput): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor) return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' };
    if (actor.role !== 'admin') return forbidden();
    const parsedInput = CourseDraftInputSchema.safeParse(input);
    if (!parsedInput.success) return { ok: false, code: 'VALIDATION_ERROR', message: parsedInput.error.issues[0]?.message ?? 'راجع البيانات وحاول تاني.', details: parsedInput.error.format() };
    const courses = readCourses();
    if (courses.some((course) => course.slug === parsedInput.data.slug || course.slugHistory.includes(parsedInput.data.slug))) return { ok: false, code: 'SLUG_TAKEN', message: 'الرابط مستخدم بالفعل.' };
    const now = new Date().toISOString();
    const snapshot: Snapshot = {
      details: { title: parsedInput.data.title, shortDescription: { ar: '', en: '' }, category: parsedInput.data.category,
        instructor: { name: { ar: '', en: '' }, title: { ar: '', en: '' } },
        coverImage: { src: '/images/course-cover-default.webp', alt: parsedInput.data.title, decorative: false },
        delivery: { method: 'online', location: { ar: '', en: '' }, attendanceNotes: { ar: '', en: '' } },
        schedule: { startDate: '', endDate: '', scheduleText: { ar: '', en: '' }, duration: { ar: '', en: '' } },
        pricing: { price: null, promo: null, currency: 'EGP', contactUs: false },
        enrollment: { registrationOpen: false, capacity: null }, accreditation: { text: { ar: '', en: '' }, verifiedByAcademy: false },
        whatsappOverrides: { number: '', messageTemplate: { ar: '', en: '' } } },
      page: createTemplatePageConfig(parsedInput.data.template ?? 'full', parsedInput.data.title), form: { fields: [] }, seo: { title: parsedInput.data.title, description: { ar: '', en: '' } },
    };
    const created = CourseSchema.safeParse({ id: crypto.randomUUID(), slug: parsedInput.data.slug, slugHistory: [], status: 'draft', featured: false, createdBy: actor.id, createdAt: now, updatedAt: now, version: 1, published: null, draft: snapshot });
    if (!created.success) return { ok: false, code: 'VALIDATION_ERROR', message: 'ما قدرناش نجهّز الكورس. راجع البيانات وحاول تاني.', details: created.error.format() };
    courses.unshift(created.data); writeCourses(courses); return { ok: true, data: created.data };
  },

  async saveDraft(id: string, snapshot: Snapshot, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor();
    if (!actor) return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' };
    if (actor.role !== 'admin') return forbidden();
    const parsed = SnapshotSchema.safeParse(snapshot);
    if (!parsed.success) return { ok: false, code: 'VALIDATION_ERROR', message: 'بيانات الكورس مش صحيحة. راجع المدخلات وحاول تاني.', details: parsed.error.format() };
    const courses = readCourses(); const index = courses.findIndex((item) => item.id === id && !item.deletedAt);
    if (index < 0) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    const course = courses[index]; const nextSlug = parsed.data.details.slug?.trim().toLowerCase();
    if (nextSlug && nextSlug !== course.slug) {
      if (!courseSlugPattern.test(nextSlug) || nextSlug.length < 3 || nextSlug.length > 80 || reservedSlugs.has(nextSlug)) return { ok: false, code: 'VALIDATION_ERROR', message: 'الرابط المختصر مش صالح أو محجوز.' };
      if (courses.some((item) => item.id !== id && (item.slug === nextSlug || item.slugHistory.includes(nextSlug)))) return { ok: false, code: 'SLUG_TAKEN', message: 'الرابط المختصر مستخدم بالفعل.' };
    }
    if (expectedVersion !== undefined && course.version !== expectedVersion) return { ok: false, code: 'CONCURRENCY_CONFLICT', message: 'الكورس اتحدّث في مكان تاني. حدّث الصفحة وجرّب تاني.' };
    const updated = { ...course, ...(nextSlug && nextSlug !== course.slug ? { slug: nextSlug, slugHistory: [...new Set([...course.slugHistory, course.slug])] } : {}), draft: parsed.data, version: course.version + 1, updatedAt: new Date().toISOString() };
    courses[index] = updated; writeCourses(courses); return { ok: true, data: updated };
  },

  async publish(id: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor(); if (!actor) return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' }; if (actor.role !== 'admin') return forbidden();
    const courses = readCourses(); const index = courses.findIndex((item) => item.id === id && !item.deletedAt); if (index < 0) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    const course = courses[index]; if (course.status === 'archived') return { ok: false, code: 'INVALID_TRANSITION', message: 'ما ينفعش تنشر كورس مؤرشف. ألغِ الأرشفة الأول.' };
    if (expectedVersion !== undefined && course.version !== expectedVersion) return { ok: false, code: 'CONCURRENCY_CONFLICT', message: 'الكورس اتغير. حدّث الصفحة قبل النشر.' };
    const readiness = checkReadiness({ details: course.draft.details, page: course.draft.page, form: course.draft.form }, course.slug);
    if (readiness.errors.length) return { ok: false, code: 'READINESS_FAILED', message: 'الكورس مش جاهز للنشر. راجع البيانات المطلوبة.', details: readiness.errors };
    const updated: Course = { ...course, status: 'published', published: course.draft, version: course.version + 1, updatedAt: new Date().toISOString() };
    courses[index] = updated; writeCourses(courses); return { ok: true, data: updated };
  },

  async unpublish(id: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor(); if (!actor) return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' }; if (actor.role !== 'admin') return forbidden();
    const courses = readCourses(); const index = courses.findIndex((item) => item.id === id && !item.deletedAt); if (index < 0) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    const course = courses[index]; if (course.status !== 'published') return { ok: false, code: 'INVALID_TRANSITION', message: 'الكورس مش منشور دلوقتي.' };
    if (expectedVersion !== undefined && course.version !== expectedVersion) return { ok: false, code: 'CONCURRENCY_CONFLICT', message: 'الكورس اتحدّث. حدّث الصفحة قبل ما تجرّب تاني.' };
    const updated: Course = { ...course, status: 'draft', draft: { ...course.draft, details: { ...course.draft.details, enrollment: { ...course.draft.details.enrollment, registrationOpen: false } } }, version: course.version + 1, updatedAt: new Date().toISOString() };
    courses[index] = updated; writeCourses(courses); return { ok: true, data: updated };
  },

  async archive(id: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor(); if (!actor) return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' }; if (actor.role !== 'admin') return forbidden();
    const courses = readCourses(); const index = courses.findIndex((item) => item.id === id && !item.deletedAt); if (index < 0) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    const course = courses[index]; if (expectedVersion !== undefined && course.version !== expectedVersion) return { ok: false, code: 'CONCURRENCY_CONFLICT', message: 'الكورس اتحدّث. حدّث الصفحة قبل ما تجرّب تاني.' };
    const updated: Course = { ...course, status: 'archived', draft: { ...course.draft, details: { ...course.draft.details, enrollment: { ...course.draft.details.enrollment, registrationOpen: false } } }, version: course.version + 1, updatedAt: new Date().toISOString() };
    courses[index] = updated; writeCourses(courses); return { ok: true, data: updated };
  },

  async unarchive(id: string, expectedVersion?: number): Promise<Result<Course>> {
    const actor = await getActor(); if (!actor) return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' }; if (actor.role !== 'admin') return forbidden();
    const courses = readCourses(); const index = courses.findIndex((item) => item.id === id && !item.deletedAt); if (index < 0) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    const course = courses[index]; if (expectedVersion !== undefined && course.version !== expectedVersion) return { ok: false, code: 'CONCURRENCY_CONFLICT', message: 'الكورس اتحدّث. حدّث الصفحة قبل ما تجرّب تاني.' };
    const updated: Course = { ...course, status: course.published ? 'published' : 'draft', version: course.version + 1, updatedAt: new Date().toISOString() };
    courses[index] = updated; writeCourses(courses); return { ok: true, data: updated };
  },

  async remove(id: string): Promise<Result<{ softDeleted: boolean }>> {
    const actor = await getActor(); if (!actor) return { ok: false, code: 'UNAUTHORIZED', message: 'سجّل دخولك الأول.' }; if (actor.role !== 'admin') return forbidden();
    const courses = readCourses(); const index = courses.findIndex((item) => item.id === id && !item.deletedAt); if (index < 0) return { ok: false, code: 'NOT_FOUND', message: 'ما لقيناش الكورس.' };
    const close = (snapshot: Snapshot): Snapshot => ({ ...snapshot, details: { ...snapshot.details, enrollment: { ...snapshot.details.enrollment, registrationOpen: false } } });
    const now = new Date().toISOString(); const course = courses[index]; courses[index] = { ...course, deletedAt: now, updatedAt: now, version: course.version + 1, draft: close(course.draft), published: course.published ? close(course.published) : null };
    writeCourses(courses); return { ok: true, data: { softDeleted: true } };
  },

  async checkSlug(slug: string, exceptId?: string): Promise<Result<boolean>> {
    if (!slug || slug.length < 3 || slug.length > 80 || !courseSlugPattern.test(slug) || reservedSlugs.has(slug)) return { ok: true, data: false };
    return { ok: true, data: !readCourses().some((course) => course.id !== exceptId && (course.slug === slug || course.slugHistory.includes(slug))) };
  },
  async getPublishedBySlug(slug: string): Promise<Result<Course>> {
    const course = readCourses().find((item) => !item.deletedAt && item.status === 'published' && item.published && (item.slug === slug || item.slugHistory.includes(slug)));
    return course ? { ok: true, data: course } : { ok: false, code: 'NOT_FOUND', message: 'الكورس ده مش متاح دلوقتي.' };
  },
  async listPublished(): Promise<Result<Course[]>> { return { ok: true, data: readCourses().filter((item) => !item.deletedAt && item.status === 'published' && item.published) }; },
};



