import { z } from 'zod';
import { BilingualTextSchema, IconNameSchema, ImageRefSchema, CtaLinkSchema, createSectionSchema } from './common';

export const StepsSectionSchema = createSectionSchema('steps', z.object({
  title: BilingualTextSchema.optional(),
  items: z.array(z.object({
    image: ImageRefSchema.optional(), icon: IconNameSchema.optional(),
    title: BilingualTextSchema, text: BilingualTextSchema,
  }).strict().superRefine((item, ctx) => {
    if (!item.image && !item.icon) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose an image or icon.', path: ['icon'] });
  })).default([]),
  cta: CtaLinkSchema.optional(),
}).strict());
