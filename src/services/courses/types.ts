import type { CourseStatus } from '@/schemas/course';
import type { CourseTemplateId } from './templates';
export type Result<T> = { ok: true; data: T } | { ok: false; code: string; message: string; details?: unknown };
export interface CourseListFilters { status?: CourseStatus | 'all'; hasUnpublishedChanges?: boolean; search?: string; category?: string; sort?: 'newest' | 'oldest' | 'title'; page?: number; pageSize?: number; }
export interface CourseListItem { id: string; slug: string; status: CourseStatus; deletedAt?: string; hasUnpublishedChanges: boolean; featured: boolean; title: { ar: string; en: string }; publishedTitle?: { ar: string; en: string }; publishedWhatsappNumber?: string; category: string; coverImage: { src: string; alt: { ar: string; en: string } }; updatedAt: string; createdAt: string; version: number; enrollmentCount?: number; paymentCount?: number; }
export interface CourseStatusCounts { all: number; published: number; draft: number; archived: number; unpublished_changes: number; }
export interface CourseListResponse { items: CourseListItem[]; total: number; page: number; pageSize: number; pageCount: number; counts: CourseStatusCounts; }
export interface CreateCourseInput { title: { ar: string; en: string }; category: string; slug: string; template?: CourseTemplateId; }
