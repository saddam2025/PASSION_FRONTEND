import { z } from 'zod';
import { CourseDetailsSchema } from './course';
import { PageConfigSchema } from './sections';

export const RevisionStatusSchema = z.enum([
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'superseded',
]);
export const RevisionSchema = z
  .object({
    id: z.string(),
    courseId: z.string(),
    kind: z.enum(['new_course', 'update']),
    status: RevisionStatusSchema,
    authorId: z.string(),
    baseVersion: z.number().int().nonnegative(),
    createdAt: z.string(),
    submittedAt: z.string().optional(),
    reviewerId: z.string().optional(),
    reviewedAt: z.string().optional(),
    rejectionReason: z.string().max(1000).optional(),
    snapshot: z.object({ details: CourseDetailsSchema, pageConfig: PageConfigSchema }).strict(),
    summary: z
      .object({
        detailsChanged: z.number().int().nonnegative(),
        sectionsChanged: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();
export type Revision = z.infer<typeof RevisionSchema>;
