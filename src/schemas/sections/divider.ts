import { z } from 'zod';
import { createSectionSchema } from './common';
export const DividerSectionSchema = createSectionSchema(
  'divider',
  z
    .object({
      variant: z.enum(['line', 'space', 'dots']).default('line'),
      size: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
    })
    .strict(),
);
