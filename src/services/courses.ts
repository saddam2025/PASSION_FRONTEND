import { apiCoursesService, apiPublicCoursesService } from './courses.api';

export const coursesService = apiCoursesService;
export const publicCoursesService = apiPublicCoursesService;
export type * from './courses/types';
export type { CourseTemplateId } from './courses/templates';
export type {
  CourseSummary,
  CourseListOptions,
  CourseListResult,
  CoursePageDetail,
  GetCourseBySlugResult,
  CoursesService,
} from './courses.types';
