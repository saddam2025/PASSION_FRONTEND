import { z } from 'zod';
import { BilingualTextSchema, ImageRefSchema, createSectionSchema } from './common';
export const GallerySectionSchema = createSectionSchema(
  'gallery',
  z
    .object({
      items: z
        .array(
          z.object({ image: ImageRefSchema, caption: BilingualTextSchema.optional() }).strict(),
        )
        .max(24)
        .default([]),
      layout: z.enum(['grid2', 'grid3', 'grid4']).default('grid3'),
    })
    .strict(),
);
