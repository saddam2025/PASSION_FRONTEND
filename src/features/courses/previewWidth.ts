export type CoursePreviewWidth = 1200 | 768 | 375;

export function initialCoursePreviewWidth(): CoursePreviewWidth {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 375 : 1200;
}
