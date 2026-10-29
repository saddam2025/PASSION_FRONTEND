import type { BilingualText } from '@/schemas';
export type HomeSectionType =
  | 'hero'
  | 'about'
  | 'trustStrip'
  | 'featuredCourses'
  | 'whyUs'
  | 'howItWorks'
  | 'instructor'
  | 'accreditation'
  | 'testimonials'
  | 'gallery'
  | 'faq'
  | 'contact';
export interface HomeSection {
  id: string;
  type: HomeSectionType;
  visible: boolean;
  order: number;
  content: Record<string, unknown>;
}
export interface PrivacySection {
  heading: BilingualText;
  paragraphs: BilingualText[];
}
export interface SiteContent {
  homeSections: HomeSection[];
  privacy: PrivacySection[];
}
