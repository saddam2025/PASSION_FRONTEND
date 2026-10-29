import { z } from 'zod';
import { BilingualTextSchema, CtaLinkSchema, IconNameSchema, ExpandableDetailSchema, createSectionSchema } from './common';
import { BilingualRichTextSchema } from './richText';
export const PricingCtaSectionSchema = createSectionSchema(
  'pricingCta',
  z
    .object({
      title: BilingualTextSchema,
      note: BilingualRichTextSchema.optional(),
      bullets: z.array(z.object({ text: BilingualTextSchema }).strict()).default([]),
      useCoursePrice: z.boolean().default(true),
      layout: z.enum(['card', 'inline']).default('card'),
      overrideLabel: BilingualTextSchema.optional(),
      cta: CtaLinkSchema.optional(),
      paymentType: BilingualTextSchema.optional(),
      includes: z.array(z.object({ text: BilingualTextSchema, icon: IconNameSchema.default('CheckCircle2'), details: z.array(ExpandableDetailSchema).default([]), detailsMode: z.enum(['inline', 'modal']).default('inline') }).strict()).default([]),
      facts: z.array(z.object({ icon: IconNameSchema, label: BilingualTextSchema, value: BilingualTextSchema }).strict()).default([]),
      whatsappCta: z.boolean().default(false),
    })
    .strict(),
);
