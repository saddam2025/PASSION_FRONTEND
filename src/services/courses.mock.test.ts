import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCoursesService } from './courses.mock';
import { readCourses, resetCourses, writeCourses } from './courses/storage';

const values = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
};

describe('public course mock service', () => {
  beforeEach(() => {
    values.clear();
    vi.stubGlobal('window', { localStorage: localStorageMock });
    resetCourses();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns only published, non-deleted snapshots and never reads changed draft content', async () => {
    const courses = readCourses();
    const live = courses.find((course) => course.id === 'course-seed-001')!;
    const draft = courses.find((course) => course.id === 'course-seed-002')!;
    const archived = courses.find((course) => course.id === 'course-seed-005')!;
    const unpublished = { ...live, id: 'unpublished-copy', slug: 'unpublished-copy', status: 'draft' as const };
    const deleted = { ...live, id: 'deleted-copy', slug: 'deleted-copy', deletedAt: new Date().toISOString() };
    writeCourses([
      { ...live, draft: { ...live.draft, details: { ...live.draft.details, title: { ar: 'مسودة لا تظهر', en: '' } } } },
      draft,
      archived,
      unpublished,
      deleted,
    ]);

    const result = await mockCoursesService.listPublished();
    expect(result.map((course) => course.slug)).toEqual(['executive-leadership']);
    expect(result[0].title.ar).toBe('القيادة التنفيذية الفعالة');
    const detail = await mockCoursesService.getPublishedBySlug('executive-leadership');
    expect(detail.status === 'ok' && detail.course.whatsappNumber).toBe('+201000000000');
    expect(await mockCoursesService.getPublishedBySlug('communication-skills')).toEqual({ status: 'notFound' });
    expect(await mockCoursesService.getPublishedBySlug('remote-team-management')).toEqual({ status: 'notFound' });
  });

  it('resolves a historical slug only to the currently published course', async () => {
    const courses = readCourses();
    const course = courses.find((item) => item.id === 'course-seed-001')!;
    writeCourses(courses.map((item) => item.id === course.id ? { ...item, slugHistory: ['old-leadership'] } : item));
    expect(await mockCoursesService.getPublishedBySlug('old-leadership')).toEqual({
      status: 'redirect',
      slug: 'executive-leadership',
    });
  });
});
