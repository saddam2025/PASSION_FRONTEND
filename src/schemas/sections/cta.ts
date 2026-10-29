import { z } from 'zod';
import { BilingualTextSchema, CtaLinkSchema, createSectionSchema } from './common';
export const CtaSectionSchema = createSectionSchema(
  'cta',
  z
    .object({
      title: BilingualTextSchema,
      text: BilingualTextSchema.optional(),
      primaryCta: CtaLinkSchema,
      secondaryCta: CtaLinkSchema.optional(),
      layout: z.enum(['banner', 'card']).default('banner'),
    })
    .strict(),
);
