import { z } from 'zod';

export const reservedSlugs = new Set([
  'admin',
  'assistant',
  'api',
  'courses',
  'login',
  'invite',
  'dev',
  'privacy',
  'terms',
  'register-confirmation',
  'review',
]);

export const CourseDraftInputSchema = z
  .object({
    title: z.object({ ar: z.string().trim().max(180), en: z.string().trim().max(180) }).strict(),
    slug: z
      .string()
      .min(3)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .refine((slug) => !reservedSlugs.has(slug), 'This slug is reserved.'),
    category: z.string().trim().min(1).max(100),
  })
  .strict()
  .refine((input) => Boolean(input.title.ar || input.title.en), {
    path: ['title'],
    message: 'Add a course title in Arabic or English.',
  });
export type CourseDraftInput = z.infer<typeof CourseDraftInputSchema>;
