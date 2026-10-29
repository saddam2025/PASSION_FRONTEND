import { z } from 'zod';
import { BilingualTextSchema, ImageRefSchema, createSectionSchema } from './common';
import { BilingualRichTextSchema } from './richText';
export const TestimonialsSectionSchema = createSectionSchema(
  'testimonials',
  z
    .object({
      title: BilingualTextSchema,
      items: z
        .array(
          z
            .object({
              quote: BilingualRichTextSchema.optional(),
              authorName: BilingualTextSchema,
              authorRole: BilingualTextSchema.optional(),
              photo: ImageRefSchema.optional(),
              video: z.object({ provider: z.enum(['youtube', 'vimeo']), videoId: z.string().regex(/^[A-Za-z0-9_-]{6,20}$/), title: BilingualTextSchema }).strict().optional(),
            })
            .strict(),
        )
        .default([]),
      layout: z.enum(['carousel', 'grid']).default('carousel'),
      mode: z.enum(['text', 'video', 'mixed']).default('text'),
    })
    .strict()
    .superRefine((content, ctx) => {
      content.items.forEach((item, index) => {
        if (content.mode === 'video' && !item.video) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Add a video for each item in video mode.', path: ['items', index, 'video'] });
        if (content.mode === 'text' && !item.quote) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Add a quote for each item in text mode.', path: ['items', index, 'quote'] });
        if (content.mode === 'mixed' && !item.video && !item.quote) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Add a quote or video.', path: ['items', index] });
      });
    }),
);
