import { z } from 'zod';
import type { FormDefinition } from '@/schemas/registrationForm';
import { normalizePhone as normalizePhoneDigits, isLikelyValidPhone } from '@/lib/phone';

export function normalizePhone(value: string): string {
  return `+${normalizePhoneDigits(value)}`;
}
export function buildSubmissionSchema(definition: FormDefinition) {
  const shape: z.ZodRawShape = {
    fullName: z.string().trim().min(2).max(120),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    phone: z
      .string()
      .trim()
      .min(7)
      .max(24)
      .transform(normalizePhone)
      .refine(
        (value) => isLikelyValidPhone(value.replace(/\D/g, '')),
        'Enter a valid international phone number.',
      ),
    consent: z.literal(true, { errorMap: () => ({ message: 'Consent is required.' }) }),
  };
  for (const field of definition.fields) {
    const limit = field.maxLength ?? (field.type === 'textarea' ? 4000 : 300);
    let value: z.ZodTypeAny;
    if (field.type === 'checkbox') value = field.required ? z.literal(true) : z.boolean();
    else if (field.type === 'select' || field.type === 'radio')
      value = z
        .string()
        .refine(
          (entry) => Boolean(field.options?.some((option) => option.value === entry)),
          'Choose one of the available options.',
        );
    else if (field.type === 'email') value = z.string().trim().email().max(limit);
    else if (field.type === 'phone')
      value = z
        .string()
        .trim()
        .min(7)
        .max(24)
        .transform(normalizePhone)
        .refine(
          (entry) => isLikelyValidPhone(entry.replace(/\D/g, '')),
          'Enter a valid international phone number.',
        );
    else value = z.string().trim().max(limit);
    if (!field.required && field.type !== 'checkbox') value = value.optional().or(z.literal(''));
    else if (field.required && field.type !== 'checkbox')
      value = value.refine(
        (entry) => entry !== '' && entry !== undefined,
        'This field is required.',
      );
    shape[field.id] = value;
  }
  return z.object(shape).strict();
}
export type SubmissionValues = {
  fullName: string;
  email: string;
  phone: string;
  consent: true;
} & Record<string, string | boolean | undefined>;
