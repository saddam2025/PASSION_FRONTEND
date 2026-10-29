import { z } from 'zod';
import { BilingualTextSchema, IconNameSchema, ImageRefSchema, ExpandableDetailSchema, createSectionSchema } from './common';
export const BenefitsSectionSchema = createSectionSchema(
  'benefits',
  z
    .object({
      title: BilingualTextSchema,
      items: z
        .array(
          z
            .object({
              icon: IconNameSchema.optional(),
              image: ImageRefSchema.optional(),
              badge: BilingualTextSchema.optional(),
              title: BilingualTextSchema,
              text: BilingualTextSchema.optional(),
              details: z.array(ExpandableDetailSchema).default([]),
              detailsMode: z.enum(['inline', 'modal']).default('inline'),
            })
            .strict(),
        )
        .default([]),
      layout: z.enum(['checklist', 'cards2', 'cards3']).default('cards3'),
    })
    .strict(),
);
