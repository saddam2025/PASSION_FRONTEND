import { describe, expect, it } from 'vitest';
import { orderHomeCourses } from './publicCourses';

describe('orderHomeCourses', () => {
  it('orders featured first, then newest within each group, and caps the grid at 12', () => {
    const courses = Array.from({ length: 14 }, (_, index) => ({
      id: index,
      featured: index === 0 || index === 12,
      publishedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    }));
    const result = orderHomeCourses(courses);
    expect(result).toHaveLength(12);
    expect(result.slice(0, 2).map((course) => course.id)).toEqual([12, 0]);
    expect(result[2].id).toBe(13);
  });
});
