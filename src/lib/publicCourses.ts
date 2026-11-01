export interface HomeOrderedCourse {
  featured: boolean;
  publishedAt: string;
}

export function orderHomeCourses<T extends HomeOrderedCourse>(
  courses: T[],
  limit = 12,
): T[] {
  return [...courses]
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        b.publishedAt.localeCompare(a.publishedAt),
    )
    .slice(0, Math.max(0, limit));
}
