import { z } from 'zod';
import { BilingualTextSchema, CtaLinkSchema, ImageRefSchema, VideoEmbedSchema, createSectionSchema } from './common';
export const HeroSectionSchema = createSectionSchema(
  'hero',
  z
    .object({
      eyebrow: BilingualTextSchema.optional(),
      title: BilingualTextSchema.superRefine((value, ctx) => {
        for (const language of ['ar', 'en'] as const) if (value[language].split('\n').length > 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Headlines must fit within three lines.', path: [language] });
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
