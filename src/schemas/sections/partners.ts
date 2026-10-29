import { z } from 'zod';
import { BilingualTextSchema, ImageRefSchema, SafeUrlSchema, createSectionSchema } from './common';
export const PartnersSectionSchema = createSectionSchema(
  'partners',
  z
    .object({
      title: BilingualTextSchema.optional(),
      layout: z.enum(['row', 'grid']).default('row'),
      logos: z
        .array(
          z
            .object({
              image: ImageRefSchema,
              name: BilingualTextSchema,
              link: SafeUrlSchema.optional(),
            })
            .strict(),
        )
        .default([]),
    })
    .strict(),
);
