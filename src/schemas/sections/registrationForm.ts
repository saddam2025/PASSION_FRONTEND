import { z } from 'zod';
import { BilingualTextSchema, createSectionSchema } from './common';
export const RegistrationFormSectionSchema = createSectionSchema(
  'registrationForm',
  z
    .object({
      title: BilingualTextSchema,
      subtitle: BilingualTextSchema.optional(),
      successNote: BilingualTextSchema.optional(),
      layout: z.literal('card').default('card'),
    })
    .strict(),
);
