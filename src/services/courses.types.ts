import type { BilingualText } from '@/schemas';
import type { ImageRef } from '@/schemas/sections';
import type { PageConfig } from '@/schemas/sections';
import type { FormDefinition } from '@/schemas/registrationForm';
import type { BilingualRichText } from '@/schemas/sections';
export interface CourseSummary {
  slug: string;
  title: BilingualText;
  shortDescription: BilingualText;
  seoTitle?: BilingualText;
  seoDescription?: BilingualText;
  noindex?: boolean;
  ogImage?: ImageRef;
  category: BilingualText;
  instructorName: BilingualText;
  coverImage: ImageRef;
  price: number | null;
  promoPrice: number | null;
  currency: string;
  startDate: string;
  duration: BilingualText;
  deliveryMethod: 'online' | 'inPerson' | 'hybrid' | '';
  publishedAt: string;
  featured: boolean;
  accreditationVerified?: boolean;
  instructor?: {
    name: BilingualText;
    title?: BilingualText;
    bio?: BilingualRichText;
    photo?: ImageRef;
  };
  delivery?: {
    method: 'online' | 'in_person' | 'hybrid';
    location?: BilingualText;
    attendanceNotes?: BilingualText;
  };
  schedule?: {
    startDate?: string;
    endDate?: string;
    scheduleText?: BilingualText;
    duration?: BilingualText;
  };
  accreditation?: {
    certificateType?: BilingualText;
    statement?: BilingualText;
    accreditingBody?: BilingualText;
  };
}
export interface CourseListOptions {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sort?: 'newest' | 'price' | 'startDate';
}
export interface CourseListResult {
  items: CourseSummary[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
export interface CoursePageDetail extends CourseSummary {
  id: string;
  registrationOpen: boolean;
  whatsappNumber?: string;
  whatsappUrl?: string;
  whatsappMessageTemplate: BilingualText;
  pageConfig: PageConfig;
  formDefinition: FormDefinition;
}
export type GetCourseBySlugResult =
  | { status: 'ok'; course: CoursePageDetail }
  | { status: 'redirect'; slug: string }
  | { status: 'notFound' };
export interface CoursesService {
  list(options: CourseListOptions): Promise<CourseListResult>;
  getCategories(): Promise<BilingualText[]>;
  getFeatured(limit: number): Promise<CourseSummary[]>;
  listPublished(): Promise<CourseSummary[]>;
  findPublishedBySlug(slug: string): Promise<CourseSummary | null>;
  getPublishedBySlug(slug: string): Promise<GetCourseBySlugResult>;
  getBySlug(slug: string): Promise<GetCourseBySlugResult>;
}
