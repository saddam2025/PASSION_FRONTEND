import { z } from 'zod';
import type { FormDefinition } from '@/schemas/registrationForm';
import { normalizePhone as normalizePhoneDigits, isLikelyValidPhone } from '@/lib/phone';

export function normalizePhone(value: string): string {
  return `+${normalizePhoneDigits(value)}`;
}
export function buildSubmissionSchema(definition: FormDefinition, foreignPricingEnabled = false) {
  const shape: z.ZodRawShape = {
    fullName: z.string().trim().min(1, 'الحقل ده مطلوب.').min(2, 'اكتب الاسم كامل بشكل صحيح.').max(120, 'الاسم طويل زيادة.'),
    email: z
      .string()
      .trim()
      .min(1, 'الحقل ده مطلوب.')
      .email('اكتب بريد إلكتروني صحيح.')
      .max(254, 'البريد الإلكتروني طويل زيادة.')
      .transform((value) => value.toLowerCase()),
    phone: z
      .string()
      .trim()
      .min(1, 'الحقل ده مطلوب.')
      .min(7, 'اكتب رقم الهاتف كامل.')
      .max(24, 'رقم الهاتف طويل زيادة.')
      .transform(normalizePhone)
      .refine(
        (value) => isLikelyValidPhone(value.replace(/\D/g, '')),
        'اكتب رقم هاتف صحيح، زي 01012345678.',
      ),
    consent: z.literal(true, { errorMap: () => ({ message: 'الموافقة مطلوبة.' }) }),
    // Registered honeypot is sent to the API for bot detection, but never
    // participates in user validation.
    honeypot: z.string().optional().default(''),
  };
  if (foreignPricingEnabled) shape.audience = z.enum(['egyptian', 'foreign'], { errorMap: () => ({ message: 'اختار الفئة المناسبة قبل التسجيل.' }) });
  for (const field of definition.fields) {
    const limit = field.maxLength ?? (field.type === 'textarea' ? 4000 : 300);
    let value: z.ZodTypeAny;
    if (field.type === 'checkbox') value = z.boolean().default(false).refine((checked) => !field.required || checked, 'الحقل ده مطلوب.');
    else if (field.type === 'select' || field.type === 'radio')
      value = z
        .string()
        .refine((entry) => !field.required || entry !== '', 'الحقل ده مطلوب.')
        .refine(
          (entry) => entry === '' || Boolean(field.options?.some((option) => option.value === entry)),
          'اختار قيمة من الاختيارات المتاحة.',
        );
    else value = z.string().trim().max(limit, 'النص أطول من الحد المسموح.');
    if (!field.required && field.type !== 'checkbox') value = value.optional().or(z.literal(''));
    else if (field.required && field.type !== 'checkbox' && field.type !== 'select' && field.type !== 'radio')
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
  audience?: 'egyptian' | 'foreign';
} & Record<string, string | boolean | undefined>;
