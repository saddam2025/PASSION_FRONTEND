// MOCK: public adapter reading from courses v2 store
import type {
  CoursePageDetail,
  CourseListOptions,
  CourseSummary,
  CoursesService,
} from '@/services/courses.types';
import { readCourses } from '@/services/courses/storage';
import { orderHomeCourses } from '@/lib/publicCourses';
import { readMockDb } from '@/mocks/db';
import { resolveCourseSeo } from '@/lib/courseSeo';

const live = (): CoursePageDetail[] =>
  readCourses()
    .filter((course) => course.status === 'published' && course.published !== null && !course.deletedAt)
    .map((record) => {
      const snap = record.published!;
      const d = snap.details;
      const seoDefaults = (readMockDb().settings.values.seo ?? {}) as { titleTemplate?: string; description?: { ar?: string }; ogImage?: string; allowSearchEngines?: boolean };
      const seo = resolveCourseSeo(snap, seoDefaults);
      return {
        id: record.id,
        slug: record.slug,
        title: d.title,
        shortDescription: d.shortDescription,
        seoTitle: seo.title,
        seoDescription: seo.description,
        noindex: seo.noindex,
        ogImage: seo.ogImage,
        category: { ar: d.category, en: d.category },
        instructorName: d.instructor.name,
        coverImage: d.coverImage,
        price: d.pricing.price,
        promoPrice: d.pricing.promo ?? null,
        currency: d.pricing.currency,
        startDate: d.schedule.startDate ?? '',
        duration: d.schedule.duration ?? { ar: '', en: '' },
        deliveryMethod:
          d.delivery.method === 'in_person' ? ('inPerson' as const) : d.delivery.method,
        publishedAt:
          record.updatedAt,
        featured: record.featured,
        accreditationVerified: d.accreditation.verifiedByAcademy,
        instructor: d.instructor,
        delivery: d.delivery,
        schedule: d.schedule,
        accreditation: {
          statement: d.accreditation.text,
        },
        registrationOpen: d.enrollment.registrationOpen,
        whatsappNumber: d.whatsappOverrides?.number,
        whatsappUrl: d.whatsappOverrides?.url,
        whatsappMessageTemplate: d.whatsappOverrides?.messageTemplate ?? { ar: '', en: '' },
        pageConfig: snap.page,
        formDefinition: snap.form,
      };
    });

const text = (value: { ar: string; en: string }, q: string) =>
  value.ar.toLocaleLowerCase().includes(q.toLocaleLowerCase());

export const mockCoursesService: CoursesService = {
  async list({
    search = '',
    category = '',
    page = 1,
    pageSize = 9,
    sort = 'newest',
  }: CourseListOptions) {
    const items = live().filter(
      (course) =>
        (!search || text(course.title, search) || text(course.shortDescription, search)) &&
        (!category || course.category.ar === category),
    );
    items.sort((a, b) =>
      sort === 'price'
        ? (a.promoPrice ?? a.price ?? Infinity) - (b.promoPrice ?? b.price ?? Infinity)
        : sort === 'startDate'
          ? (a.startDate || '9999').localeCompare(b.startDate || '9999')
          : b.publishedAt.localeCompare(a.publishedAt),
    );
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
      pageCount: Math.ceil(items.length / pageSize),
    };
  },
  async getCategories() {
    return [...new Map(live().map((course) => [course.category.ar, course.category])).values()];
  },
  async getFeatured(limit) {
    return orderHomeCourses(live(), limit);
  },
  async listPublished() {
    return live();
  },
  async findPublishedBySlug(slug: string): Promise<CourseSummary | null> {
    return live().find((course) => course.slug === slug) ?? null;
  },
  async getPublishedBySlug(slug: string) {
    const course = live().find((item) => item.slug === slug);
    if (course) return { status: 'ok' as const, course: course as CoursePageDetail };
    const renamed = readCourses().find(
      (item) => item.slugHistory.includes(slug) && item.status === 'published' && item.published !== null && !item.deletedAt,
    );
    if (renamed) return { status: 'redirect' as const, slug: renamed.slug };
    return { status: 'notFound' as const };
  },
  async getBySlug(slug: string) {
    return mockCoursesService.getPublishedBySlug(slug);
  },
};

