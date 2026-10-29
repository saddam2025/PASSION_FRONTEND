import { z } from 'zod';
import { BilingualTextSchema, createSectionSchema } from './common';
export const StatisticsSectionSchema = createSectionSchema(
  'statistics',
  z
    .object({
      title: BilingualTextSchema.optional(),
      layout: z.enum(['row', 'grid']).default('row'),
      items: z
        .array(
          z
            .object({
              value: z.string().trim().max(40),
              suffix: BilingualTextSchema.optional(),
              label: BilingualTextSchema,
            })
            .strict(),
        )
        .default([]),
    })
    .strict(),
);
