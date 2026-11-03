// Adapter for legacy imports forwarding to courses v2 service
import { coursesService } from '@/services/courses';
import { publicCoursesService } from '@/services/courses';
import { apiAuthService } from '@/services/auth.api';
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

async function requireAdmin() {
  const current = await apiAuthService.getCurrentUser();
  if (current?.role !== 'admin') throw new CourseServiceError('FORBIDDEN', 'الخدمة دي متاحة لمدير الأكاديمية بس.');
}

export const coursesAdminService = {
  async categories(): Promise<string[]> {
    await requireAdmin();
    return [...new Set((await publicCoursesService.getCategories()).map((item) => item.ar).filter(Boolean))];
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
    await requireAdmin();
    const res = await coursesService.checkSlug(slug, exceptId);
    if (!res.ok) throw new CourseServiceError(res.code, res.message, res.details);
    return res.data;
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
