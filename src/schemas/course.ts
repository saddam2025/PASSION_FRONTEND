import { z } from 'zod';
import { BilingualTextSchema, MediaKeySchema } from '@/schemas/sections';
import { FormDefinitionSchema } from '@/schemas/registrationForm';
import { BilingualRichTextSchema } from '@/schemas/sections';
import { PageConfigSchema } from '@/schemas/sections';

const rich = BilingualRichTextSchema;
const optionalText = BilingualTextSchema.optional();
const minorUnits = z.number().int().nonnegative().nullable();
const CourseImageRefSchema = z
  .object({
    assetId: z.string().min(1).max(100).optional(),
    src: MediaKeySchema,
    alt: BilingualTextSchema,
    decorative: z.boolean().default(false),
  })
  .strict();

export const CourseDetailsSchema = z
  .object({
    title: BilingualTextSchema,
    slug: z.string().max(80),
    category: z.string().trim().max(100),
    shortDescription: BilingualTextSchema,
    featured: z.boolean().default(true),
    targetAudience: rich,
    instructor: z
      .object({
        name: BilingualTextSchema,
        title: optionalText,
        bio: rich,
        photo: CourseImageRefSchema.optional(),
      })
      .strict(),
    coverImage: CourseImageRefSchema,
    gallery: z.array(CourseImageRefSchema).max(24).optional(),
    delivery: z
      .object({
        method: z.enum(['online', 'in_person', 'hybrid']),
        location: optionalText,
        attendanceNotes: optionalText,
      })
      .strict(),
    schedule: z
      .object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        scheduleText: optionalText,
        duration: optionalText,
      })
      .strict(),
    pricing: z
      .object({
        price: minorUnits,
        contactUs: z.boolean().default(false),
        promoPrice: z.number().int().nonnegative().nullable().optional(),
        currency: z.enum(['EGP', 'USD', 'SAR', 'AED', 'EUR']).default('EGP'),
        paymentInstructions: rich,
        paymentMethods: z
          .array(z.enum(['cash', 'bank_transfer', 'e_wallet', 'instapay', 'other']))
          .default([]),
      })
      .strict(),
    enrollment: z
      .object({
        registrationOpen: z.boolean(),
        capacity: z.number().int().positive().nullable().optional(),
        registrationDeadline: z.string().optional(),
      })
      .strict(),
    accreditation: z
      .object({
        certificateType: optionalText,
        statement: optionalText,
        accreditingBody: optionalText,
        verifiedByAcademy: z.boolean().default(false),
      })
      .strict(),
    requirements: rich,
    registrationForm: FormDefinitionSchema,
    contact: z
      .object({
        whatsappNumberOverride: z.string().max(30).optional(),
        whatsappMessageTemplate: optionalText,
      })
      .strict(),
    seo: z
      .object({
        title: optionalText,
        description: optionalText,
        ogImage: CourseImageRefSchema.optional(),
      })
      .strict(),
  })
  .strict();

export type CourseDetails = z.infer<typeof CourseDetailsSchema>;
export const CourseStatusSchema = z.enum([
  'draft',
  'pending_review',
  'published',
  'rejected',
  'archived',
]);
export type CourseStatus = z.infer<typeof CourseStatusSchema>;
export const CourseSchema = z
  .object({
    id: z.string().min(1),
    details: CourseDetailsSchema,
    pageConfig: PageConfigSchema,
    status: CourseStatusSchema,
    publishedVersion: z.number().int().nonnegative(),
    slugHistory: z.array(z.string().max(80)),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().optional(),
  })
  .strict();
export type CourseRecord = z.infer<typeof CourseSchema>;
