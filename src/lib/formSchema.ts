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
    consent: z.literal(true, { errorMap: () => ({ message: 'الموافقة مطلوبة.' }) }),
  };
  for (const field of definition.fields) {
    const limit = field.maxLength ?? (field.type === 'textarea' ? 4000 : 300);
    let value: z.ZodTypeAny;
    if (field.type === 'checkbox') value = z.boolean().default(false).refine((checked) => !field.required || checked, 'الحقل ده مطلوب.');
    else if (field.type === 'select' || field.type === 'radio')
      value = z
        .string()
        .refine(
          (entry) => Boolean(field.options?.some((option) => option.value === entry)),
          'اختار قيمة من الاختيارات المتاحة.',
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
        'اكتب رقم تليفون صحيح.',
        );
    else value = z.string().trim().max(limit);
    if (!field.required && field.type !== 'checkbox') value = value.optional().or(z.literal(''));
    else if (field.required && field.type !== 'checkbox')
      value = value.refine(
        (entry) => entry !== '' && entry !== undefined,
        'الحقل ده مطلوب.',
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
