// MOCK: values are derived from the existing fake course fixtures until settings APIs replace them.
import { mockCourseRecords } from './courses';
export const mockCourseCategories = [
  ...new Set(mockCourseRecords.map((course) => course.category.ar)),
];
