import { apiRequest, ApiError } from '@/api/client';
import type { Course, Snapshot } from '@/schemas/course';
import { CourseSchema, SnapshotSchema } from '@/schemas/course';
import { hasUnpublishedChanges } from '@/services/courses/hash';
import { createTemplatePageConfig } from '@/services/courses/templates';
import type { CourseListFilters, CourseListItem, CourseListResponse, CreateCourseInput, Result } from '@/services/courses/types';
import type { CourseListOptions, CourseListResult, CoursePageDetail, CourseSummary, CoursesService, GetCourseBySlugResult } from '@/services/courses.types';
import { appQueryClient } from '@/app/queryClient';

type WireCourse = Record<string, unknown>;
type WireList = { items: WireCourse[]; total: number; page: number; pageSize: number; pageCount: number };
const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
const fail = <T,>(error: unknown): Result<T> => ({ ok: false, code: error instanceof ApiError ? error.code : 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'حصلت مشكلة، جرّب تاني.', details: error instanceof ApiError ? error.details : undefined });
const bilingual = (value: unknown): { ar: string; en: string } => typeof value === 'string' ? { ar: value, en: '' } : value && typeof value === 'object' ? { ar: String((value as Record<string, unknown>).ar ?? ''), en: '' } : { ar: '', en: '' };
export function invalidateCourseCaches(client: { invalidateQueries(options: { queryKey: readonly unknown[] }): unknown } = appQueryClient) {
  void client.invalidateQueries({ queryKey: ['public-courses'] });
  void client.invalidateQueries({ queryKey: ['public-course'] });
  void client.invalidateQueries({ queryKey: ['course'] });
  void client.invalidateQueries({ queryKey: ['courses-list'] });
}
function courseFromWire(input: WireCourse): Course {
  const course = Object.fromEntries(Object.entries(input).filter(([key]) => key !== 'hasUnpublishedChanges'));
  const parsed = CourseSchema.safeParse({ ...course, id: String(input.id ?? ''), createdBy: String(input.createdBy ?? 'api'), deletedAt: input.deletedAt ?? undefined, draft: input.draft, published: input.published ?? null });
  if (!parsed.success) throw new Error('بيانات الكورس المستلمة غير مكتملة.');
  return parsed.data;
}
export function mapAdminCourseListItem(input: WireCourse): CourseListItem {
  const course = courseFromWire(input);
  return {
    id: course.id, slug: course.slug, status: course.status,
    hasUnpublishedChanges: typeof input.hasUnpublishedChanges === 'boolean' ? input.hasUnpublishedChanges : hasUnpublishedChanges(course), featured: course.featured,
    title: bilingual(course.draft.details.title),
    ...(course.published ? { publishedTitle: bilingual(course.published.details.title), publishedWhatsappNumber: course.published.details.whatsappOverrides?.number } : {}),
    category: course.draft.details.category,
    coverImage: { ...course.draft.details.coverImage, alt: bilingual(course.draft.details.coverImage.alt) },
    createdAt: course.createdAt, updatedAt: course.updatedAt, version: course.version,
    // The API omits these counts; keep them absent so the UI does not show a false zero.
    ...(Number.isFinite(input.enrollmentCount) ? { enrollmentCount: Number(input.enrollmentCount) } : {}),
    ...(Number.isFinite(input.paymentCount) ? { paymentCount: Number(input.paymentCount) } : {}),
  };
}
export function mapPublicCourseSummary(input: Record<string, unknown>): CourseSummary {
  const details = input;
  return {
    slug: String(details.slug ?? ''), title: bilingual(details.title), shortDescription: bilingual(details.shortDescription),
    seoTitle: bilingual(details.seoTitle), seoDescription: bilingual(details.seoDescription), noindex: Boolean(details.noindex),
    ...(details.ogImage ? { ogImage: details.ogImage as CourseSummary['ogImage'] } : {}), category: bilingual(details.category), instructorName: bilingual(details.instructorName),
    coverImage: { ...(details.coverImage as CourseSummary['coverImage']), alt: bilingual((details.coverImage as { alt?: unknown } | undefined)?.alt) },
    // API snapshots use integer minor units; public formatters consume major units.
    price: typeof details.price === 'number' ? details.price / 100 : null,
    promoPrice: typeof details.promoPrice === 'number' ? details.promoPrice / 100 : null, currency: String(details.currency ?? 'EGP'),
    pricingContactUs: details.pricingContactUs === true || details.contactUs === true || details.price == null,
    ...(details.foreignPricing && typeof details.foreignPricing === 'object' && (details.foreignPricing as { enabled?: unknown }).enabled === true ? { foreignPricing: {
      enabled: true,
      price: typeof (details.foreignPricing as { price?: unknown }).price === 'number' ? Number((details.foreignPricing as { price: number }).price) / 100 : null,
      promoPrice: typeof (details.foreignPricing as { promoPrice?: unknown }).promoPrice === 'number' ? Number((details.foreignPricing as { promoPrice: number }).promoPrice) / 100 : null,
      currency: 'USD' as const,
      ...((details.foreignPricing as { contactUs?: unknown }).contactUs === true ? { contactUs: true } : {}),
    } } : {}),
    startDate: String(details.startDate ?? ''), duration: bilingual(details.duration),
    deliveryMethod: details.deliveryMethod === 'inPerson' || details.deliveryMethod === 'online' || details.deliveryMethod === 'hybrid' ? details.deliveryMethod : '',
    publishedAt: String(details.publishedAt ?? ''), featured: Boolean(details.featured), accreditationVerified: Boolean(details.accreditationVerified),
    ...(details.instructor ? { instructor: details.instructor as CourseSummary['instructor'] } : {}),
    ...(details.delivery ? { delivery: details.delivery as CourseSummary['delivery'] } : {}),
    ...(details.schedule ? { schedule: details.schedule as CourseSummary['schedule'] } : {}),
    ...(details.accreditation ? { accreditation: details.accreditation as CourseSummary['accreditation'] } : {}),
  };
}
export function mapPublicCoursePage(input: Record<string, unknown>): CoursePageDetail {
  const summary = mapPublicCourseSummary(input);
  const snapshot = SnapshotSchema.parse({ details: {
    title: input.title, shortDescription: input.shortDescription, category: (input.category as { ar?: string } | undefined)?.ar ?? '',
    instructor: input.instructor ?? { name: input.instructorName ?? { ar: '' } }, coverImage: input.coverImage,
    delivery: input.delivery ?? { method: input.deliveryMethod === 'inPerson' ? 'in_person' : input.deliveryMethod || 'online' },
    schedule: input.schedule ?? { startDate: input.startDate }, pricing: { price: input.price ?? null, promoPrice: input.promoPrice ?? undefined, currency: input.currency ?? 'EGP' },
    foreignPricing: input.foreignPricing ?? { enabled: false },
    enrollment: { registrationOpen: input.registrationOpen === true }, accreditation: input.accreditation ?? { verifiedByAcademy: input.accreditationVerified === true },
  }, page: input.pageConfig, form: input.formDefinition, seo: { title: input.seoTitle ?? input.title, description: input.seoDescription ?? input.shortDescription, noindex: input.noindex, ogImage: input.ogImage } });
  return { ...summary, id: String(input.id ?? input.slug), registrationOpen: input.registrationOpen === true,
    whatsappNumber: typeof input.whatsappNumber === 'string' ? input.whatsappNumber : undefined,
    whatsappUrl: typeof input.whatsappUrl === 'string' ? input.whatsappUrl : undefined,
    whatsappMessageTemplate: bilingual(input.whatsappMessageTemplate), pageConfig: snapshot.page, formDefinition: snapshot.form };
}
function initialDraft(input: CreateCourseInput): Snapshot {
  return SnapshotSchema.parse({
    details: {
      title: input.title, shortDescription: { ar: '', en: '' }, category: input.category,
      instructor: { name: { ar: '', en: '' }, title: { ar: '', en: '' }, bio: { ar: [], en: [] } },
      coverImage: { src: '/images/course-cover-default.webp', alt: input.title, decorative: false },
      delivery: { method: 'online', location: { ar: '', en: '' }, attendanceNotes: { ar: '', en: '' } },
      schedule: { startDate: '', endDate: '', scheduleText: { ar: '', en: '' }, duration: { ar: '', en: '' } },
      pricing: { price: null, promo: null, currency: 'EGP', contactUs: false },
      enrollment: { registrationOpen: false, capacity: null },
      accreditation: { text: { ar: '', en: '' }, verifiedByAcademy: false },
      whatsappOverrides: { number: '', messageTemplate: { ar: '', en: '' } },
    },
    page: createTemplatePageConfig(input.template ?? 'full', input.title), form: { fields: [] },
    seo: { title: input.title, description: { ar: '', en: '' } },
  });
}

export const apiCoursesService = {
  async list(filters: CourseListFilters = {}): Promise<Result<CourseListResponse>> {
    try {
      const first = await apiRequest<WireList>('courses?page=1&pageSize=100&sort=newest');
      const records = [...first.items];
      for (let page = 2; page <= first.pageCount; page += 1) records.push(...(await apiRequest<WireList>(`courses?page=${page}&pageSize=100&sort=newest`)).items);
      const all = records.filter((item) => !item.deletedAt).map(mapAdminCourseListItem);
      const counts = { all: all.length, published: all.filter((item) => item.status === 'published').length, draft: all.filter((item) => item.status === 'draft').length, archived: all.filter((item) => item.status === 'archived').length, unpublished_changes: all.filter((item) => item.hasUnpublishedChanges).length };
      const query = (filters.search ?? '').trim().toLocaleLowerCase();
      let filtered = all.filter((item) => (!filters.status || filters.status === 'all' || item.status === filters.status)
        && (!filters.category || item.category === filters.category)
        && (!query || `${item.title.ar} ${item.slug} ${item.category}`.toLocaleLowerCase().includes(query))
        && (!filters.hasUnpublishedChanges || item.hasUnpublishedChanges));
      if (filters.sort === 'oldest') filtered = filtered.sort((a,b) => a.createdAt.localeCompare(b.createdAt));
      else if (filters.sort === 'title') filtered = filtered.sort((a,b) => a.title.ar.localeCompare(b.title.ar));
      else filtered = filtered.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
      const page = Math.max(1, filters.page ?? 1); const pageSize = Math.max(1, Math.min(100, filters.pageSize ?? 20)); const total = filtered.length;
      return ok({ items: filtered.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, pageCount: Math.ceil(total / pageSize) || 1, counts });
    } catch (error) { return fail(error); }
  },
  async get(id: string): Promise<Result<Course>> { try { const raw = await apiRequest<{ course: WireCourse }>(`courses/${encodeURIComponent(id)}`); return ok(courseFromWire(raw.course)); } catch (error) { return fail(error); } },
  async create(input: CreateCourseInput): Promise<Result<Course>> { try { const draft = initialDraft(input); const raw = await apiRequest<{ course: WireCourse }>('courses', { method: 'POST', body: JSON.stringify({ slug: input.slug, draft, featured: false }) }); invalidateCourseCaches(); return ok(courseFromWire(raw.course)); } catch (error) { return fail(error); } },
  async saveDraft(id: string, draft: Snapshot, expectedVersion?: number): Promise<Result<Course>> { try { const raw = await apiRequest<{ course: WireCourse }>(`courses/${encodeURIComponent(id)}/draft`, { method: 'PUT', body: JSON.stringify({ expectedVersion: expectedVersion ?? 0, draft: asSnapshot(draft) }) }); invalidateCourseCaches(); return ok(courseFromWire(raw.course)); } catch (error) { return fail(error); } },
  async publish(id: string, expectedVersion?: number): Promise<Result<Course>> { return this.statusAction(id, 'publish', expectedVersion); },
  async unpublish(id: string, expectedVersion?: number): Promise<Result<Course>> { return this.statusAction(id, 'unpublish', expectedVersion); },
  async archive(id: string, expectedVersion?: number): Promise<Result<Course>> { return this.statusAction(id, 'archive', expectedVersion); },
  async unarchive(id: string, expectedVersion?: number): Promise<Result<Course>> { return this.statusAction(id, 'unarchive', expectedVersion); },
  async statusAction(id: string, action: 'publish'|'unpublish'|'archive'|'unarchive', expectedVersion?: number): Promise<Result<Course>> { try { const current = expectedVersion === undefined ? await this.get(id) : null; if (current && !current.ok) return current; const version = expectedVersion ?? (current && current.ok ? current.data.version : 0); const raw = await apiRequest<{ course: WireCourse }>(`courses/${encodeURIComponent(id)}/${action}`, { method: 'POST', body: JSON.stringify({ expectedVersion: version }) }); invalidateCourseCaches(); return ok(courseFromWire(raw.course)); } catch (error) { const result = fail<Course>(error); if (result.ok) return result; return action === 'publish' && error instanceof ApiError && error.status === 422 ? { ...result, code: 'READINESS_FAILED' } : result; } },
  async remove(id: string): Promise<Result<{ softDeleted: boolean }>> { try { const current = await this.get(id); if (!current.ok) return current; await apiRequest(`courses/${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({ expectedVersion: current.data.version }) }); invalidateCourseCaches(); return ok({ softDeleted: true }); } catch (error) { return fail(error); } },
  async checkSlug(slug: string, exceptId?: string): Promise<Result<boolean>> { try { const params = new URLSearchParams({ slug, ...(exceptId ? { exceptId } : {}) }); const result = await apiRequest<{ available: boolean }>(`courses/check-slug?${params}`); return ok(result.available); } catch (error) { return fail(error); } },
};

export const apiPublicCoursesService: CoursesService = {
  async list(options: CourseListOptions): Promise<CourseListResult> { const key = ['public-courses', options] as const; return appQueryClient.fetchQuery({ queryKey: key, staleTime: 30_000, queryFn: async () => { const pageSize = 50; const params = new URLSearchParams({ page: '1', pageSize: String(pageSize), ...(options.search ? { q: options.search } : {}), ...(options.category ? { category: options.category } : {}) }); const first = await apiRequest<WireList>(`public/courses?${params}`); const records = [...first.items]; for (let pageNo = 2; pageNo <= first.pageCount; pageNo += 1) records.push(...(await apiRequest<WireList>(`public/courses?${new URLSearchParams({ page: String(pageNo), pageSize: String(pageSize), ...(options.search ? { q: options.search } : {}), ...(options.category ? { category: options.category } : {}) })}`)).items); const items = records.map((item) => mapPublicCourseSummary(item)); if (options.sort === 'price') items.sort((a,b) => (a.promoPrice ?? a.price ?? Infinity) - (b.promoPrice ?? b.price ?? Infinity)); else if (options.sort === 'startDate') items.sort((a,b) => a.startDate.localeCompare(b.startDate)); const total = first.total; const page = Math.max(1, options.page ?? 1); const resultSize = Math.max(1, Math.min(50, options.pageSize ?? 9)); return { items: items.slice((page - 1) * resultSize, page * resultSize), total, page, pageSize: resultSize, pageCount: Math.ceil(total / resultSize) }; } }); },
  async getCategories() { return appQueryClient.fetchQuery({ queryKey: ['public-courses','categories'], staleTime: 60_000, queryFn: async () => { const data = await apiRequest<{ items: Array<Record<string, unknown>> }>('categories/public'); return data.items.map((item) => bilingual(item.name)); } }); },
  async getFeatured(limit: number) { return appQueryClient.fetchQuery({ queryKey: ['public-courses','featured',limit], staleTime: 30_000, queryFn: async () => { const data = await apiRequest<WireList>(`public/courses?featured=true&page=1&pageSize=${Math.min(limit, 50)}`); return data.items.map(mapPublicCourseSummary); } }); },
  async listPublished() { return appQueryClient.fetchQuery({ queryKey: ['public-courses','published'], staleTime: 30_000, queryFn: async () => { const first = await apiRequest<WireList>('public/courses?page=1&pageSize=50'); const records = [...first.items]; for (let page = 2; page <= first.pageCount; page += 1) records.push(...(await apiRequest<WireList>(`public/courses?page=${page}&pageSize=50`)).items); return records.map(mapPublicCourseSummary); } }); },
  async findPublishedBySlug(slug: string) { const result = await this.getPublishedBySlug(slug); return result.status === 'ok' ? result.course : null; },
  async getPublishedBySlug(slug: string): Promise<GetCourseBySlugResult> { try { return await appQueryClient.fetchQuery({ queryKey: ['public-course',slug], staleTime: 30_000, queryFn: async () => { const data = await apiRequest<{ status?: string; course?: Record<string, unknown>; slug?: string }>(`public/courses/${encodeURIComponent(slug)}`); if (data.status === 'redirect' && data.slug) return { status: 'redirect' as const, slug: data.slug }; if (data.course) return { status: 'ok' as const, course: mapPublicCoursePage(data.course) }; return { status: 'notFound' as const }; } }); } catch (error) { if (error instanceof ApiError && error.status === 404) return { status: 'notFound' }; throw error; } },
  async getBySlug(slug: string) { return this.getPublishedBySlug(slug); },
};

export function asSnapshot(value: Snapshot): Snapshot {
  const copy = JSON.parse(JSON.stringify(value)) as Snapshot;
  if (!copy.details.foreignPricing.enabled) {
    copy.details.foreignPricing = { enabled: false, price: null, promoPrice: null, currency: 'USD' };
  }
  return SnapshotSchema.parse(copy);
}

