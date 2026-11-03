import { createContext, useContext, type PropsWithChildren } from 'react';
import type { BilingualText } from '@/schemas';
import type { ImageRef, BilingualRichText } from '@/schemas/sections';
import type { FormDefinition } from '@/schemas/registrationForm';
import type { SectionMode } from './types';
export interface CoursePageData {
  id: string;
  slug: string;
  title: BilingualText;
  shortDescription: BilingualText;
  coverImage?: ImageRef;
  price: number | null;
  promoPrice: number | null;
  currency: string;
  startDate: string;
  registrationOpen: boolean;
  pricingContactUs?: boolean;
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
  whatsappNumberOverride?: string;
  whatsappUrlOverride?: string;
  whatsappMessageTemplate: BilingualText;
}
export interface CoursePageSettings {
  academyName: BilingualText;
  whatsappNumber: string;
  phone: string;
  email: string;
  privacyUrl?: string;
  registrationWhatsappTemplate?: string;
}
export interface CoursePageContextValue {
  course: CoursePageData;
  settings: CoursePageSettings;
  formDefinition: FormDefinition;
  mode: SectionMode;
}
const CoursePageContext = createContext<CoursePageContextValue | null>(null);
export function CoursePageProvider({
  value,
  children,
}: PropsWithChildren<{ value: CoursePageContextValue }>) {
  return <CoursePageContext.Provider value={value}>{children}</CoursePageContext.Provider>;
}
export function useCoursePage() {
  const context = useContext(CoursePageContext);
  if (!context) throw new Error('سياق صفحة الكورس مش متاح.');
  return context;
}
