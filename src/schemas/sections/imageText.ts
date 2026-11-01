import { z } from 'zod';
import { BilingualTextSchema, CtaLinkSchema, ImageRefSchema, createSectionSchema } from './common';
import { BilingualRichTextSchema } from './richText';
export const ImageTextSectionSchema = createSectionSchema(
  'imageText',
  z
    .object({
      image: ImageRefSchema,
      checklist: z.array(z.object({ text: BilingualTextSchema }).strict()).default([]),
      title: BilingualTextSchema,
      richText: BilingualRichTextSchema,
      cta: CtaLinkSchema.optional(),
      layout: z.enum(['imageStart', 'imageEnd', 'imageTop']).default('imageStart'),
      imageRatio: z.enum(['square', 'landscape', 'portrait']).default('landscape'),
    })
    .strict(),
);
