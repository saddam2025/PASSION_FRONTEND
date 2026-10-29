import { z } from 'zod';
import { BilingualTextSchema, CtaLinkSchema, ImageRefSchema, createSectionSchema } from './common';

export const BannerSectionSchema = createSectionSchema('banner', z.object({
  image: ImageRefSchema,
  ratio: z.enum(['wide', 'cinema', 'standard']).default('wide'),
  overlayTitle: BilingualTextSchema.optional(),
  overlayText: BilingualTextSchema.optional(),
  cta: CtaLinkSchema.optional(),
}).strict());
