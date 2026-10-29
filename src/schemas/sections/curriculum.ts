import { z } from 'zod';
import { BilingualTextSchema, ImageRefSchema, createSectionSchema } from './common';
export const CurriculumSectionSchema = createSectionSchema(
  'curriculum',
  z
    .object({
      title: BilingualTextSchema,
      modules: z
        .array(
          z
            .object({
              title: BilingualTextSchema,
              summary: BilingualTextSchema.optional(),
              lessons: z.array(z.object({ title: BilingualTextSchema }).strict()).default([]),
              duration: BilingualTextSchema.optional(),
              image: ImageRefSchema.optional(),
            })
            .strict(),
        )
        .default([]),
      layout: z.enum(['accordion', 'timeline', 'numberedCards']).default('accordion'),
    })
    .strict(),
);
