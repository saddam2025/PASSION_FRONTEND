// Adapter for legacy imports forwarding to courses v2 service
import { coursesService } from '@/services/courses';
import { readMockDb } from '@/mocks/db';
import type { CourseListItem } from '@/services/courses/types';
import type { CourseStatus } from '@/schemas/course';

export class CourseServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public errors?: unknown,
  ) {
    super(message);
  }
}

export const coursesAdminService = {
  async categories(): Promise<string[]> {
    const db = readMockDb();
    const categories = db.settings.values.categories;
    if (categories && typeof categories === 'object' && !Array.isArray(categories)) {
      const items = (categories as Record<string, unknown>).items;
      if (Array.isArray(items)) {
        const names = items.flatMap((item): string[] => {
          if (typeof item === 'string') return [item];
          if (item && typeof item === 'object' && 'name' in item) {
            const name = (item as { name?: unknown }).name;
            if (typeof name === 'string') return [name];
            if (name && typeof name === 'object' && 'ar' in name) {
              const arabic = (name as { ar?: unknown }).ar;
              if (typeof arabic === 'string') return [arabic];
            }
          }
          return [];
        });
        if (names.length) return [...new Set(names)];
      }
    }
    return [];
  },

  async usage(id: string) {
    const db = readMockDb();
    const enrollmentIds = new Set(
      db.enrollments.filter((item) => item.courseId === id).map((item) => item.id),
    );
    return {
      enrollmentCount: enrollmentIds.size,
      paymentCount: db.payments.filter((item) => enrollmentIds.has(item.enrollmentId)).length,
    };
  },

  async list(options: {
    status?: CourseStatus | 'all';
    search?: string;
    category?: string;
    sort?: 'newest' | 'oldest' | 'title';
    page?: number;
    pageSize?: number;
  } = {}) {
    const res = await coursesService.list({
      status: options.status,
      search: options.search,
      category: options.category,
      sort: options.sort,
      page: options.page,
      pageSize: options.pageSize,
    });
    if (!res.ok) throw new CourseServiceError(res.code, res.message);
    return res.data;
  },

  async getById(id: string) {
    const res = await coursesService.get(id);
    if (!res.ok) throw new CourseServiceError(res.code, res.message);
    return res.data;
  },

  async checkSlug(slug: string, exceptId?: string): Promise<boolean> {
    const res = await coursesService.checkSlug(slug, exceptId);
    return res.ok ? res.data : false;
  },

  async archive(id: string) {
    const res = await coursesService.archive(id);
    if (!res.ok) throw new CourseServiceError(res.code, res.message);
    return res.data;
  },

  async unarchive(id: string) {
    const res = await coursesService.unarchive(id);
    if (!res.ok) throw new CourseServiceError(res.code, res.message);
    return res.data;
  },

  async remove(id: string) {
    const res = await coursesService.remove(id);
    if (!res.ok) throw new CourseServiceError(res.code, res.message);
    return res.data;
  },

  async unpublish(id: string) {
    const res = await coursesService.unpublish(id);
    if (!res.ok) throw new CourseServiceError(res.code, res.message);
    return res.data;
  },

  async publishDirect(id: string) {
    const res = await coursesService.publish(id);
    if (!res.ok) throw new CourseServiceError(res.code, res.message, res.details);
    return res.data;
  },
};
export type { CourseListItem };
