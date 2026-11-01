import { z } from 'zod';
import {
  BilingualTextSchema,
  MediaKeySchema,
  PageConfigSchema,
  BilingualRichTextSchema,
} from '@/schemas/sections';
import { FormDefinitionSchema } from '@/schemas/registrationForm';

const optionalText = BilingualTextSchema.optional();
const minorUnits = z.number().int().nonnegative().nullable();
export function hasInvalidWhatsappTokens(value: string): boolean {
  return /[{}]/.test(value.replace(/\{(?:name|course|reference)\}/g, ''));
}

export const CourseImageRefSchema = z
  .object({
    assetId: z.string().min(1).max(100).optional(),
    src: MediaKeySchema,
    alt: BilingualTextSchema,
    decorative: z.boolean().default(false),
  })
  .strict();
export type CourseImageRef = z.infer<typeof CourseImageRefSchema>;

export const CoursePricingSchema = z
  .object({
    price: minorUnits,
    promo: minorUnits.optional(),
    promoPrice: minorUnits.optional(),
    currency: z.enum(['EGP', 'USD', 'SAR', 'AED', 'EUR']).default('EGP'),
    contactUs: z.boolean().optional(),
    paymentInstructions: BilingualRichTextSchema.optional(),
    paymentMethods: z.array(z.string()).optional(),
  })
  .strict();
export type CoursePricing = z.infer<typeof CoursePricingSchema>;

export const CourseInstructorSchema = z
  .object({
    name: BilingualTextSchema,
    title: optionalText,
    bio: BilingualRichTextSchema.optional(),
    photo: CourseImageRefSchema.optional(),
  })
  .strict();
export type CourseInstructor = z.infer<typeof CourseInstructorSchema>;

export const CourseDeliverySchema = z
  .object({
    method: z.enum(['online', 'in_person', 'hybrid']),
    location: optionalText,
    attendanceNotes: optionalText,
  })
  .strict();
export type CourseDelivery = z.infer<typeof CourseDeliverySchema>;

export const CourseScheduleSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    scheduleText: optionalText,
    duration: optionalText,
  })
  .strict();
export type CourseSchedule = z.infer<typeof CourseScheduleSchema>;

export const CourseEnrollmentSchema = z
  .object({
    registrationOpen: z.boolean().default(false),
    capacity: z.number().int().positive().nullable().optional(),
    registrationDeadline: z.string().optional(),
  })
  .strict();
export type CourseEnrollment = z.infer<typeof CourseEnrollmentSchema>;

export const CourseAccreditationSchema = z
  .object({
    text: optionalText,
    statement: optionalText,
    certificateType: optionalText,
    accreditingBody: optionalText,
    verifiedByAcademy: z.boolean().default(false),
  })
  .strict();
export type CourseAccreditation = z.infer<typeof CourseAccreditationSchema>;

export const CourseWhatsappOverridesSchema = z
  .object({
    number: z.string().max(30).optional(),
    url: z.string().max(2048).refine((value) => {
      if (!value) return true;
      try { const url = new URL(value); return url.protocol === 'https:' && ['wa.me', 'api.whatsapp.com'].includes(url.hostname); } catch { return false; }
    }, 'رابط واتساب غير صالح.').optional(),
    whatsappNumberOverride: z.string().max(30).optional(),
    messageTemplate: optionalText,
    whatsappMessageTemplate: optionalText,
  })
  .strict()
  .superRefine((value, ctx) => {
    const number = value.number?.trim();
    if (number && !/^\+[0-9\s()-]{8,20}$/.test(number)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['number'], message: 'اكتب رقم واتساب صحيحًا مع مفتاح الدولة.' });
    const template = value.messageTemplate?.ar ?? value.whatsappMessageTemplate?.ar ?? '';
    if (hasInvalidWhatsappTokens(template)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['messageTemplate'], message: 'متغيرات الرسالة غير معروفة.' });
  });
export type CourseWhatsappOverrides = z.infer<typeof CourseWhatsappOverridesSchema>;

export const CourseSeoSchema = z
  .object({
    title: optionalText,
    description: optionalText,
    ogImage: CourseImageRefSchema.optional(),
    noindex: z.boolean().optional(),
  })
  .strict();
export type CourseSeo = z.infer<typeof CourseSeoSchema>;

export const CourseDetailsSchema = z
  .object({
    title: BilingualTextSchema,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(80).optional(),
    shortDescription: BilingualTextSchema,
    category: z.string().trim().max(100),
    instructor: CourseInstructorSchema,
    coverImage: CourseImageRefSchema,
    delivery: CourseDeliverySchema,
    schedule: CourseScheduleSchema,
    pricing: CoursePricingSchema,
    enrollment: CourseEnrollmentSchema,
    accreditation: CourseAccreditationSchema,
    whatsappOverrides: CourseWhatsappOverridesSchema.optional(),
    contact: CourseWhatsappOverridesSchema.optional(),
    featured: z.boolean().optional(),
    targetAudience: BilingualRichTextSchema.optional(),
    gallery: z.array(CourseImageRefSchema).optional(),
    requirements: BilingualRichTextSchema.optional(),
    registrationForm: FormDefinitionSchema.optional(),
    seo: CourseSeoSchema.optional(),
  })
  .strict()
  .superRefine((details, ctx) => {
    const price = details.pricing.price;
    const promo = details.pricing.promo ?? details.pricing.promoPrice;
    if (price !== null && promo != null && promo >= price) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pricing', 'promo'], message: 'سعر العرض لازم يكون أقل من السعر الأساسي.' });
  });
export type CourseDetails = z.infer<typeof CourseDetailsSchema>;

export const SnapshotSchema = z
  .object({
    details: CourseDetailsSchema,
    page: PageConfigSchema,
    form: FormDefinitionSchema,
    seo: CourseSeoSchema,
  })
  .strict();
export type Snapshot = z.infer<typeof SnapshotSchema>;

export const CourseStatusSchema = z.enum(['draft', 'published', 'archived']);
export type CourseStatus = z.infer<typeof CourseStatusSchema>;

export const ReviewStateSchema = z.enum(['none', 'pending', 'rejected']);
export type ReviewState = z.infer<typeof ReviewStateSchema>;

export const CourseReviewSchema = z
  .object({
    state: ReviewStateSchema,
    submittedBy: z.string().optional(),
    submittedAt: z.string().datetime().optional(),
    reviewedBy: z.string().optional(),
    reviewedAt: z.string().datetime().optional(),
    reason: z.string().max(1000).optional(),
  })
  .strict();
export type CourseReview = z.infer<typeof CourseReviewSchema>;

export const CourseDeletionRequestSchema = z
  .object({
    requestedBy: z.string().min(1),
    requestedAt: z.string().datetime(),
    reason: z.string().trim().min(10).max(1000),
  })
  .strict();
export type CourseDeletionRequest = z.infer<typeof CourseDeletionRequestSchema>;

export const CourseDeletionRejectionSchema = z
  .object({
    rejectedBy: z.string().min(1),
    rejectedAt: z.string().datetime(),
    reason: z.string().trim().min(10).max(1000),
  })
  .strict();
export type CourseDeletionRejection = z.infer<typeof CourseDeletionRejectionSchema>;

export const CourseVersionRecordSchema = z
  .object({
    version: z.number().int().positive(),
    snapshot: SnapshotSchema,
    publishedBy: z.string().min(1),
    publishedAt: z.string().datetime(),
  })
  .strict();
export type CourseVersionRecord = z.infer<typeof CourseVersionRecordSchema>;

export const CourseSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(3).max(80),
    slugHistory: z.array(z.string().min(3).max(80)).default([]),
    status: CourseStatusSchema,
    featured: z.boolean().default(false),
    createdBy: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().optional(),
    deletionRequest: CourseDeletionRequestSchema.optional(),
    deletionRequestRejection: CourseDeletionRejectionSchema.optional(),
    version: z.number().int().nonnegative().default(1),
    publishedVersion: z.number().int().nonnegative().default(0),
    published: SnapshotSchema.nullable(),
    draft: SnapshotSchema,
    review: CourseReviewSchema.default({ state: 'none' }),
    versions: z.array(CourseVersionRecordSchema).max(20).default([]),
    details: CourseDetailsSchema.optional(),
    pageConfig: PageConfigSchema.optional(),
  })
  .strict();

export type Course = z.infer<typeof CourseSchema>;
export type CourseRecord = Course;
