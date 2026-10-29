import { z } from 'zod';
import { BilingualTextSchema, ImageRefSchema, ExpandableDetailSchema, createSectionSchema } from './common';
import { BilingualRichTextSchema } from './richText';
export const InstructorSectionSchema = createSectionSchema(
  'instructor',
  z
    .object({
      name: BilingualTextSchema,
      title: BilingualTextSchema.optional(),
      photo: ImageRefSchema.optional(),
      bio: BilingualRichTextSchema,
      credentials: z.array(z.object({ text: BilingualTextSchema, details: z.array(ExpandableDetailSchema).default([]), detailsMode: z.enum(['inline', 'modal']).default('inline') }).strict()).default([]),
      layout: z.enum(['photoStart', 'photoEnd']).default('photoStart'),
    })
    .strict(),
);
