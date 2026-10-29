import { z } from 'zod';
import { BilingualTextSchema, ImageRefSchema, SafeUrlSchema, createSectionSchema } from './common';
export const AccreditationSectionSchema = createSectionSchema(
  'accreditation',
  z
    .object({
      title: BilingualTextSchema.optional(),
      items: z
        .array(
          z
            .object({
              name: BilingualTextSchema,
              description: BilingualTextSchema.optional(),
              logo: ImageRefSchema.optional(),
              link: SafeUrlSchema.optional(),
            })
            .strict(),
        )
        .default([]),
      disclaimer: BilingualTextSchema.optional(),
      layout: z.enum(['list', 'grid']).default('grid'),
    })
    .strict(),
);
