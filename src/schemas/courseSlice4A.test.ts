import { describe, expect, it } from 'vitest';
import { CourseDetailsSchema, type Snapshot } from './course';
import { checkReadiness } from './courseReadiness';
import { FormDefinitionSchema, RegistrationFieldSchema, type RegistrationField } from './registrationForm';
import { SectionSchema, SECTION_REGISTRY_META, SafeUrlSchema, RichTextSchema, type SectionType, isSectionEmpty } from './sections';
import { createTemplatePageConfig } from '@/services/courses/templates';
import { moveRegistrationField } from '@/lib/registrationFormEditor';
import { hasSectionEditor } from '@/features/courses/studio/editableSections';
import { resolveCourseSeo } from '@/lib/courseSeo';
import { buildPricingCtaModel } from '@/lib/pricingCtaModel';
import { buildSubmissionSchema } from '@/lib/formSchema';
import { slugFromArabic } from '@/lib/courseSlug';

const text = { ar: 'نص عربي', en: '' };
const details = () => CourseDetailsSchema.parse({
  title: text,
  shortDescription: text,
  category: 'التطوير المهني',
  instructor: { name: text, bio: { ar: [{ type: 'paragraph', children: [{ text: 'نبذة عن المدرب' }] }], en: [] } },
  coverImage: { src: '/images/course-cover-default.webp', alt: { ar: '', en: '' }, decorative: true },
  delivery: { method: 'online' },
  schedule: { startDate: '2026-12-01', duration: text, scheduleText: text },
  pricing: { price: 25000, currency: 'EGP' },
  enrollment: { registrationOpen: true, capacity: 20 },
  accreditation: { verifiedByAcademy: false },
});
function readySnapshot(): Snapshot {
  return {
    details: details(),
    page: { schemaVersion: 1, sections: [SectionSchema.parse({ id: '11111111-1111-4111-8111-111111111111', type: 'text', visible: true, content: { title: text, richText: { ar: [], en: [] } } })] },
    form: { fields: [] },
    seo: { title: text, description: text },
  };
}
const field = (id: string, type: RegistrationField['type'] = 'text', overrides: Partial<RegistrationField> = {}): RegistrationField => ({ id, type, label: text, required: false, ...overrides });

describe('Slice 4A course details and form schemas', () => {
  it('accepts nullable and numeric prices, rejects invalid promotions and capacity', () => {
    expect(CourseDetailsSchema.safeParse({ ...details(), pricing: { price: null, contactUs: true, currency: 'EGP' } }).success).toBe(true);
    expect(CourseDetailsSchema.safeParse({ ...details(), pricing: { price: 10000, promo: 5000, currency: 'EGP' } }).success).toBe(true);
    expect(CourseDetailsSchema.safeParse({ ...details(), pricing: { price: 10000, promo: 10000, currency: 'EGP' } }).success).toBe(false);
    expect(CourseDetailsSchema.safeParse({ ...details(), enrollment: { capacity: 0, registrationOpen: true } }).success).toBe(false);
    expect(CourseDetailsSchema.safeParse({ ...details(), enrollment: { capacity: null, registrationOpen: true } }).success).toBe(true);
  });
  it('validates optional USD pricing only while enabled and enforces positive price and lower promo', () => {
    const disabledWithOldValues = { ...details(), foreignPricing: { enabled: false, price: 50_000, promoPrice: 60_000, currency: 'USD' as const } };
    expect(CourseDetailsSchema.safeParse(disabledWithOldValues).success).toBe(true);
    expect(CourseDetailsSchema.safeParse({ ...details(), foreignPricing: { enabled: true, price: 25_000, promoPrice: 20_000, currency: 'USD' } }).success).toBe(true);
    expect(CourseDetailsSchema.safeParse({ ...details(), foreignPricing: { enabled: true, price: 0, promoPrice: null, currency: 'USD' } }).success).toBe(false);
    expect(CourseDetailsSchema.safeParse({ ...details(), foreignPricing: { enabled: true, price: 20_000, promoPrice: 20_000, currency: 'USD' } }).success).toBe(false);
    expect(CourseDetailsSchema.safeParse({ ...details(), foreignPricing: { enabled: true, price: null, promoPrice: null, currency: 'USD', contactUs: true } }).success).toBe(true);
  });
  it('validates slug patterns and WhatsApp phone, URL and template tokens', () => {
    expect(CourseDetailsSchema.safeParse({ ...details(), slug: 'valid-course' }).success).toBe(true);
    expect(CourseDetailsSchema.safeParse({ ...details(), slug: 'Invalid slug' }).success).toBe(false);
    expect(CourseDetailsSchema.safeParse({ ...details(), whatsappOverrides: { number: 'not a phone' } }).success).toBe(false);
    expect(CourseDetailsSchema.safeParse({ ...details(), whatsappOverrides: { number: '201000000000' } }).success).toBe(false);
    expect(CourseDetailsSchema.safeParse({ ...details(), whatsappOverrides: { url: 'javascript:alert(1)' } }).success).toBe(false);
    expect(CourseDetailsSchema.safeParse({ ...details(), whatsappOverrides: { messageTemplate: { ar: 'أهلًا {unknown}', en: '' } } }).success).toBe(false);
    expect(slugFromArabic('كورس تطوير الذات', 'a123')).toBe('kwrs-ttwyr-althat');
    expect(slugFromArabic('!!!', 'a123')).toBe('course-a123');
  });
  it('enforces nonempty labels, stable custom ids, unique select options and two choices', () => {
    const valid = field('custom-interest', 'select', { options: [{ value: 'choice-a', label: text }, { value: 'choice-b', label: text }] });
    expect(RegistrationFieldSchema.safeParse(valid).success).toBe(true);
    expect(RegistrationFieldSchema.safeParse({ ...valid, options: [valid.options![0]!] }).success).toBe(false);
    expect(RegistrationFieldSchema.safeParse({ ...valid, options: [valid.options![0]!, { ...valid.options![1]!, value: valid.options![0]!.value }] }).success).toBe(false);
    expect(RegistrationFieldSchema.safeParse({ ...valid, label: { ar: '  ', en: '' } }).success).toBe(false);
    expect(RegistrationFieldSchema.safeParse({ ...valid, options: [{ value: 'choice-a', label: { ar: '', en: '' } }, valid.options![1]!] }).success).toBe(false);
    expect(RegistrationFieldSchema.safeParse({ ...valid, type: 'email' }).success).toBe(false);
    expect(RegistrationFieldSchema.safeParse({ ...valid, type: 'phone' }).success).toBe(false);
    const renamed = { ...valid, label: { ar: 'اختيارك', en: '' } };
    expect(renamed.id).toBe(valid.id);
    expect(renamed.options?.map((option) => option.value)).toEqual(valid.options?.map((option) => option.value));
  });
  it('keeps reordered ids and matches the public registration field and answer contract', () => {
    const fields = [field('custom-name'), field('custom-topic', 'radio', { options: [{ value: 'topic-a', label: text }, { value: 'topic-b', label: text }] })];
    const moved = moveRegistrationField(fields, 0, 1);
    expect(moved.map((item) => item.id)).toEqual(['custom-topic', 'custom-name']);
    const parsed = FormDefinitionSchema.safeParse({ fields: moved, consentText: text });
    expect(parsed.success).toBe(true);
    expect(Object.fromEntries(moved.map((item) => [item.id, item.type === 'radio' ? 'topic-a' : 'إجابة'])))
      .toEqual({ 'custom-topic': 'topic-a', 'custom-name': 'إجابة' });
    const contract = buildSubmissionSchema(parsed.success ? parsed.data : { fields: moved });
    expect(contract.parse({ fullName:'الاسم', email:'test@example.test', phone:'+201000000000', consent:true, 'custom-topic':'topic-a', 'custom-name':'إجابة' })).toMatchObject({ 'custom-topic':'topic-a', 'custom-name':'إجابة' });
    expect(contract.safeParse({ fullName:'الاسم', email:'test@example.test', phone:'+201000000000', consent:true, 'custom-topic':'not-an-option', 'custom-name':'إجابة' }).success).toBe(false);
    expect(contract.safeParse({ fullName:'الاسم', email:'test@example.test', phone:'+201000000000', consent:true, 'custom-topic':'topic-a', 'custom-name':'إجابة', 'unknown-field':'x' }).success).toBe(false);
  });
  it('validates a required checkbox as checked and uses false for an omitted optional checkbox', () => {
    const required = field('custom-consent', 'checkbox', { required:true });
    const optional = field('custom-optional', 'checkbox');
    const schema = buildSubmissionSchema({ fields:[required,optional] });
    const base = { fullName:'الاسم', email:'test@example.test', phone:'+201000000000', consent:true };
    expect(schema.safeParse({ ...base, 'custom-consent':true }).success).toBe(true);
    expect(schema.safeParse({ ...base, 'custom-consent':false }).success).toBe(false);
    expect(schema.parse({ ...base, 'custom-consent':true })['custom-optional']).toBe(false);
  });
  it('keeps core fields fixed and caps custom fields at twelve', () => {
    for (const id of ['fullName', 'email', 'phone', 'consent']) expect(FormDefinitionSchema.safeParse({ fields: [field(id)] }).success).toBe(false);
    expect(FormDefinitionSchema.safeParse({ fields: Array.from({ length: 12 }, (_, index) => field(`custom-${index}`)) }).success).toBe(true);
    expect(FormDefinitionSchema.safeParse({ fields: Array.from({ length: 13 }, (_, index) => field(`custom-${index}`)) }).success).toBe(false);
  });
});

describe('Slice 4A sections, SEO and readiness', () => {
  it('reports enabled foreign pricing readiness on the exact price fields and accepts contact pricing', () => {
    const base = readySnapshot();
    const missing = { ...base, details: { ...base.details, foreignPricing: { enabled: true, price: null, promoPrice: null, currency: 'USD' as const, contactUs: false } } };
    expect(checkReadiness(missing).errors).toContainEqual(expect.objectContaining({ path: 'details.foreignPricing.price', tab: 'details' }));
    const contact = { ...missing, details: { ...missing.details, foreignPricing: { ...missing.details.foreignPricing, contactUs: true } } };
    expect(checkReadiness(contact).errors.some((entry) => entry.path.includes('foreignPricing'))).toBe(false);
  });
  it('supplies default content and hides empty sections, including the four new editors', () => {
    const curriculum = SectionSchema.parse({ id: '11111111-1111-4111-8111-111111111111', type: 'curriculum' });
    const instructor = SectionSchema.parse({ id: '22222222-2222-4222-8222-222222222222', type: 'instructor' });
    const pricing = SectionSchema.parse({ id: '33333333-3333-4333-8333-333333333333', type: 'pricingCta' });
    const steps = SectionSchema.parse({ id: '55555555-5555-4555-8555-555555555555', type: 'steps' });
    const stepsDefault = SECTION_REGISTRY_META.steps.defaultContent() as { items: Array<{ title: { ar: string }; text: { ar: string } }> };
    expect(curriculum.type === 'curriculum' && curriculum.content.modules).toEqual([]);
    expect(instructor.type === 'instructor' && isSectionEmpty(instructor)).toBe(true);
    expect(pricing.type === 'pricingCta' && isSectionEmpty(pricing, { price: null })).toBe(true);
    expect(pricing.type === 'pricingCta' && isSectionEmpty(pricing, { price: null, contactUs: true })).toBe(false);
    expect(stepsDefault.items).toHaveLength(4);
    expect(stepsDefault.items.every((item) => item.title.ar && item.text.ar)).toBe(true);
    expect(steps.type === 'steps' && steps.content.items).toHaveLength(4);
  });
  it('has a schema default and editor for every supported section type, rejects unsafe links and raw HTML blocks', () => {
    const types: SectionType[] = ['hero','imageText','text','featureCards','curriculum','instructor','pricingCta','steps','faq','registrationForm','contactWhatsApp','banner'];
    expect(Object.keys(SECTION_REGISTRY_META).sort()).toEqual([...types].sort());
    for (const [index, type] of types.entries()) {
      const section = SectionSchema.parse({
        id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
        type,
      });
      expect(section.visible, type).toBe(true);
      expect(hasSectionEditor(type), type).toBe(true);
      expect(SECTION_REGISTRY_META[type].defaultContent(), type).toBeTruthy();
      if (section.type === 'banner') expect(isSectionEmpty(section), type).toBe(true);
    }
    expect(SafeUrlSchema.safeParse('https://example.test/path').success).toBe(true);
    expect(SafeUrlSchema.safeParse('javascript:alert(1)').success).toBe(false);
    expect(RichTextSchema.safeParse([{ type: 'html', html: '<script>alert(1)</script>' }]).success).toBe(false);
  });
  it('renders all template section types only from the editable section set', () => {
    const types = createTemplatePageConfig('full').sections.map((item) => item.type);
    expect(types).toEqual(expect.arrayContaining(['curriculum', 'instructor', 'pricingCta', 'steps']));
  });
  it('uses SEO fields first and Settings SEO defaults when fields are empty', () => {
    const snapshot = readySnapshot();
    expect(resolveCourseSeo(snapshot, { titleTemplate: 'عنوان افتراضي', description: { ar: 'وصف افتراضي' }, allowSearchEngines: false }).title.ar).toBe('نص عربي');
    snapshot.seo = {};
    const fallback = resolveCourseSeo(snapshot, { titleTemplate: 'عنوان افتراضي', description: { ar: 'وصف افتراضي' }, ogImage: 'media/2026/11/abcdefghijklmnop.webp', allowSearchEngines: false });
    expect(fallback.title.ar).toBe('عنوان افتراضي');
    expect(fallback.description.ar).toBe('وصف افتراضي');
    expect(fallback.noindex).toBe(true);
    expect(fallback.ogImage.src).toContain('media/');
  });
  it('builds pricing CTA facts and price from course details context', () => {
    const section = SectionSchema.parse({ id:'44444444-4444-4444-8444-444444444444', type:'pricingCta' });
    if (section.type !== 'pricingCta') throw new Error('pricing CTA default missing');
    const model = buildPricingCtaModel(section.content, { id:'course-1', slug:'course-1', title:text, shortDescription:text, price:25000, promoPrice:20000, currency:'EGP', startDate:'2026-12-01', registrationOpen:true, pricingContactUs:false, whatsappMessageTemplate:{ar:'',en:''}, schedule:{duration:text}, delivery:{method:'online'} });
    expect(model.amount).toBe(20000);
    expect(model.showPrice).toBe(true);
    expect(model.facts.map((fact)=>fact.label.ar)).toEqual(expect.arrayContaining(['مدة الكورس','طريقة الحضور','تاريخ البداية']));
    const inquiry = buildPricingCtaModel(section.content, { id:'course-1', slug:'course-1', title:text, shortDescription:text, price:null, promoPrice:null, currency:'EGP', startDate:'', registrationOpen:true, pricingContactUs:true, whatsappMessageTemplate:{ar:'',en:''} });
    expect(inquiry.showPrice).toBe(false);
    expect(inquiry.label.ar).toBe('تواصل لمعرفة السعر');
  });
  it('reports zero issues for a ready course and one exact issue for each missing readiness rule', () => {
    const base = readySnapshot();
    expect(checkReadiness(base, 'ready-course').errors).toHaveLength(0);
    const cases: Array<[string, (snapshot: Snapshot) => void, string?]> = [
      ['details.title.ar', (s) => { s.details.title.ar = ''; }],
      ['details.shortDescription.ar', (s) => { s.details.shortDescription.ar = ''; }],
      ['details.category', (s) => { s.details.category = ''; }],
      ['details.coverImage.src', (s) => { s.details.coverImage.src = ''; }],
      ['details.pricing.price', (s) => { s.details.pricing.price = null; }],
      ['details.pricing.promo', (s) => { s.details.pricing.promo = s.details.pricing.price!; }],
      ['page.sections', (s) => { s.page.sections = []; }],
      ['form.fields', (s) => { s.form.fields = [field('custom-one'), field('custom-one')]; }],
    ];
    for (const [path, change] of cases) {
      const candidate = structuredClone(base);
      change(candidate);
      const result = checkReadiness(candidate, 'ready-course').errors;
      expect(result.map((item) => item.path), path).toEqual([path]);
    }
    expect(checkReadiness(base, 'not valid').errors.map((item) => item.path)).toContain('slug');
  });
});
