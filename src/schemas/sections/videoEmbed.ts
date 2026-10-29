import { z } from 'zod';
import { BilingualTextSchema, VideoEmbedSchema, createSectionSchema } from './common';
export const VideoEmbedSectionSchema = createSectionSchema(
  'videoEmbed',
  z
    .object({
      title: BilingualTextSchema,
      video: VideoEmbedSchema,
      caption: BilingualTextSchema.optional(),
    })
    .strict(),
);
