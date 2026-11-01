import type { CourseDeletionRejection, CourseDeletionRequest, CourseStatus, ReviewState } from '@/schemas/course';
import type { CourseTemplateId } from './templates';

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; details?: unknown };

export interface CourseListFilters {
  status?: CourseStatus | 'all';
  reviewState?: ReviewState;
  hasUnpublishedChanges?: boolean;
  search?: string;
  category?: string;
  sort?: 'newest' | 'oldest' | 'title';
  page?: number;
  pageSize?: number;
}

export interface CourseListItem {
  id: string;
  slug: string;
  status: CourseStatus;
  reviewState: ReviewState;
  hasUnpublishedChanges: boolean;
  featured: boolean;
  title: { ar: string; en: string };
  publishedTitle?: { ar: string; en: string };
  publishedWhatsappNumber?: string;
  category: string;
  coverImage: { src: string; alt: { ar: string; en: string } };
  authorId: string;
  authorName?: { ar: string; en: string };
  updatedAt: string;
  createdAt: string;
  version: number;
  publishedVersion: number;
  reviewReason?: string;
  deletionRequest?: CourseDeletionRequest;
  deletionRequestRejection?: CourseDeletionRejection;
  enrollmentCount: number;
  paymentCount: number;
}

export interface CourseStatusCounts {
  all: number;
  published: number;
  draft: number;
  pending_review: number;
  rejected: number;
  archived: number;
  unpublished_changes: number;
}

export interface CourseListResponse {
  items: CourseListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  counts: CourseStatusCounts;
}

export interface CreateCourseInput {
  title: { ar: string; en: string };
  category: string;
  slug: string;
  template?: CourseTemplateId;
}
