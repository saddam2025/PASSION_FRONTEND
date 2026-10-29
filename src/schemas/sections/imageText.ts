import { z } from 'zod';
import { BilingualTextSchema, CtaLinkSchema, ImageRefSchema, VideoEmbedSchema, IconNameSchema, createSectionSchema } from './common';
import { BilingualRichTextSchema } from './richText';
export const ImageTextSectionSchema = createSectionSchema(
  'imageText',
  z
    .object({
      image: ImageRefSchema.optional(),
      mediaType: z.enum(['image', 'video']).default('image'),
      video: VideoEmbedSchema.optional(),
      checklist: z.array(z.object({ text: BilingualTextSchema, icon: IconNameSchema.default('CheckCircle2') }).strict()).default([]),
      title: BilingualTextSchema,
      richText: BilingualRichTextSchema,
      cta: CtaLinkSchema.optional(),
      layout: z.enum(['imageStart', 'imageEnd', 'imageTop']).default('imageStart'),
      imageRatio: z.enum(['square', 'landscape', 'portrait']).default('landscape'),
      verticalAlign: z.enum(['start', 'center', 'end']).default('center'),
    })
    .strict()
    .superRefine((content, ctx) => {
      if (content.mediaType === 'video' && !content.video) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose a video.', path: ['video'] });
      if (content.mediaType === 'image' && !content.image) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose an image.', path: ['image'] });
    }),
);
