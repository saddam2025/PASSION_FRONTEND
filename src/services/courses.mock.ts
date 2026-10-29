// MOCK: remove in batch A4
import { mockArchivedCourse, mockRedirects } from '@/mocks/courses';
import type {
  CoursePageDetail,
  CourseListOptions,
  CourseSummary,
  CoursesService,
} from '@/services/courses.types';
import { readMockDb } from '@/mocks/db';
const live = () =>
  readMockDb()
    .courses.filter((course) => course.status === 'published' && !course.deletedAt)
    .map((record) => {
      const d = record.details;
      return {
        id: record.id,
        slug: d.slug,
        title: d.title,
        shortDescription: d.shortDescription,
        category: { ar: d.category, en: d.category },
        instructorName: d.instructor.name,
        coverImage: d.coverImage,
        price: d.pricing.price,
        promoPrice: d.pricing.promoPrice ?? null,
        currency: d.pricing.currency,
        startDate: d.schedule.startDate ?? '',
        duration: d.schedule.duration ?? { ar: '', en: '' },
        deliveryMethod:
          d.delivery.method === 'in_person' ? ('inPerson' as const) : d.delivery.method,
        publishedAt: record.updatedAt,
        featured: d.featured,
        accreditationVerified: d.accreditation.verifiedByAcademy,
        instructor: d.instructor,
        delivery: d.delivery,
        schedule: d.schedule,
        accreditation: {
          certificateType: d.accreditation.certificateType,
          statement: d.accreditation.statement,
          accreditingBody: d.accreditation.accreditingBody,
        },
        registrationOpen: d.enrollment.registrationOpen,
        whatsappMessageTemplate: d.contact.whatsappMessageTemplate ?? { ar: '', en: '' },
        pageConfig: record.pageConfig,
        formDefinition: d.registrationForm,
      };
    });
const text = (value: { ar: string; en: string }, q: string) =>
  `${value.ar} ${value.en}`.toLocaleLowerCase().includes(q.toLocaleLowerCase());
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
        (!category || course.category.en === category || course.category.ar === category),
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
    return [...new Map(live().map((course) => [course.category.en, course.category])).values()];
  },
  async getFeatured(limit) {
    return live()
      .filter((course) => course.featured)
      .slice(0, limit);
  },
  async listPublished() {
    return live();
  },
  async findPublishedBySlug(slug: string): Promise<CourseSummary | null> {
    return live().find((course) => course.slug === slug) ?? null;
  },
  async getBySlug(slug: string) {
    const course = live().find((item) => item.slug === slug);
    if (course) return { status: 'ok' as const, course: course as CoursePageDetail };
    const renamed = readMockDb().courses.find(
      (item) => item.slugHistory.includes(slug) && item.status === 'published',
    );
    if (renamed) return { status: 'redirect' as const, slug: renamed.details.slug };
    if (mockArchivedCourse.slug === slug) return { status: 'notFound' as const };
    if (mockRedirects[slug]) return { status: 'redirect' as const, slug: mockRedirects[slug]! };
    if (import.meta.env.DEV && slug === 'dev-sample-all-sections') {
      const module = await import('@/mocks/devSampleCourse');
      return { status: 'ok' as const, course: module.devSampleCourse };
    }
    return { status: 'notFound' as const };
  },
};
