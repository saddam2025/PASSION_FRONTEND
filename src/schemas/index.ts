import { z } from 'zod';

export const bilingualTextSchema = z.object({
  ar: z.string().trim().default(''),
  en: z.unknown().optional().transform(() => ''),
});
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
export const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(24)
  .regex(/^[+\d\s().-]+$/);
export const moneySchema = z.object({
  amount: z.number().finite().nonnegative(),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
});
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

export type BilingualText = z.infer<typeof bilingualTextSchema>;
export type Money = z.infer<typeof moneySchema>;

export * from './registrationForm';
export * from './sections';
