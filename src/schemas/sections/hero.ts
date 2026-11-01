import { z } from 'zod';
import { BilingualTextSchema, CtaLinkSchema, ImageRefSchema, VideoEmbedSchema, createSectionSchema } from './common';
export const HeroSectionSchema = createSectionSchema(
  'hero',
  z
    .object({
      eyebrow: BilingualTextSchema.optional(),
      title: BilingualTextSchema.superRefine((value, ctx) => {
        if (value.ar.split('\n').length > 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'العنوان ما ينفعش يزيد عن 3 سطور.', path: ['ar'] });
      }),
      subtitle: BilingualTextSchema.optional(),
      primaryCta: CtaLinkSchema.optional(),
      secondaryCta: CtaLinkSchema.optional(),
      image: ImageRefSchema.optional(),
      mediaType: z.enum(['image', 'video']).default('image'),
      video: VideoEmbedSchema.optional(),
      badgeImage: ImageRefSchema.optional(),
      layout: z
        .enum(['splitStart', 'splitEnd', 'centered', 'imageBackground'])
        .default('splitStart'),
    })
    .strict()
    .superRefine((content, ctx) => {
      if (content.mediaType === 'video' && !content.video) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choose a video.', path: ['video'] });
    }),
);
