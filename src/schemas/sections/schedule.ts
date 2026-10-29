import { z } from 'zod';
import { BilingualTextSchema, createSectionSchema } from './common';
export const ScheduleSectionSchema = createSectionSchema(
  'schedule',
  z
    .object({
      title: BilingualTextSchema,
      items: z
        .array(
          z
            .object({
              date: z.string().max(40).optional(),
              time: z.string().max(80).optional(),
              title: BilingualTextSchema,
              location: BilingualTextSchema.optional(),
              note: BilingualTextSchema.optional(),
            })
            .strict(),
        )
        .default([]),
      layout: z.enum(['list', 'table', 'timeline']).default('list'),
    })
    .strict(),
);
