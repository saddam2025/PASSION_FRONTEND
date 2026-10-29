import { z } from 'zod';
import { BilingualTextSchema } from './sections/common';

export const RegistrationFieldSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]{1,39}$/),
    type: z.enum(['text', 'email', 'phone', 'select', 'radio', 'checkbox', 'textarea']),
    label: BilingualTextSchema,
    placeholder: BilingualTextSchema.optional(),
    helpText: BilingualTextSchema.optional(),
    required: z.boolean().default(false),
    options: z
      .array(
        z.object({ value: z.string().trim().min(1).max(80), label: BilingualTextSchema }).strict(),
      )
      .max(30)
      .optional(),
    maxLength: z.number().int().min(1).max(4000).optional(),
  })
  .strict()
  .superRefine((field, ctx) => {
    if (['select', 'radio'].includes(field.type) && (!field.options || field.options.length === 0))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select and radio fields need options.',
        path: ['options'],
      });
    if (
      field.options &&
      new Set(field.options.map((option) => option.value)).size !== field.options.length
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Option values must be unique.',
        path: ['options'],
      });
  });
export const FormDefinitionSchema = z
  .object({ fields: z.array(RegistrationFieldSchema).max(12) })
  .strict()
  .superRefine((definition, ctx) => {
    const ids = definition.fields.map((field) => field.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom field ids must be unique.',
        path: ['fields'],
      });
    for (const reserved of ['fullName', 'email', 'phone', 'consent'])
      if (ids.includes(reserved))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Core fields cannot be overridden.',
          path: ['fields'],
        });
  });
export type RegistrationField = z.infer<typeof RegistrationFieldSchema>;
export type FormDefinition = z.infer<typeof FormDefinitionSchema>;
