import { CourseDetailsSchema, type CourseDetails } from './course';
import { isSectionEmpty, validatePage, type PageConfig } from './sections';

export interface ReadinessIssue {
  path: string;
  message: string;
  sectionId?: string;
}
export interface CourseSnapshot {
  details: CourseDetails;
  pageConfig: PageConfig;
}
const reserved = new Set([
  'admin',
  'api',
  'courses',
  'login',
  'invite',
  'dev',
  'assistant',
  'review',
]);
export function checkReadiness(snapshot: CourseSnapshot): {
  errors: ReadinessIssue[];
  warnings: ReadinessIssue[];
} {
  const { details, pageConfig } = snapshot;
  const errors: ReadinessIssue[] = [];
  const warnings: ReadinessIssue[] = [];
  const issue = (path: string, message: string) => errors.push({ path, message });
  for (const lang of ['ar', 'en'] as const) {
    if (!details.title[lang].trim()) issue(`title.${lang}`, 'Required title translation');
    if (!details.shortDescription[lang].trim())
      issue(`shortDescription.${lang}`, 'Required description translation');
  }
  if (
    details.slug.length < 3 ||
    details.slug.length > 80 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(details.slug) ||
    reserved.has(details.slug.split('-')[0] ?? '')
  )
    issue('slug', 'Invalid or reserved slug');
  if (!details.category.trim()) issue('category', 'Choose a category');
  if (
    !details.coverImage.src ||
    (!details.coverImage.decorative &&
      (!details.coverImage.alt.ar.trim() || !details.coverImage.alt.en.trim()))
  )
    issue('coverImage', 'Cover image needs bilingual alt text');
  if (!details.delivery.method) issue('delivery.method', 'Choose a delivery method');
  if (details.pricing.price === null && !details.pricing.contactUs)
    issue('pricing.price', 'Set a price or explicitly mark contact us');
  if (
    details.pricing.price !== null &&
    details.pricing.promoPrice != null &&
    details.pricing.promoPrice >= details.pricing.price
  )
    issue('pricing.promoPrice', 'Promo price must be lower than price');
  const visible = pageConfig.sections.filter(
    (section) =>
      section.visible &&
      !isSectionEmpty(section, {
        price: details.pricing.price,
        promoPrice: details.pricing.promoPrice ?? null,
      }),
  );
  if (!visible.length) issue('pageConfig.sections', 'Add a visible non-empty page section');
  const pageResult = validatePage(pageConfig);
  if (!pageResult.success)
    pageResult.errors.forEach((error) =>
      errors.push({
        path: error.path,
        message: error.message,
        sectionId: error.path.split('.')[1],
      }),
    );
  const parsed = CourseDetailsSchema.safeParse(details);
  if (!parsed.success)
    parsed.error.issues.forEach((entry) =>
      errors.push({ path: entry.path.join('.'), message: entry.message }),
    );
  if (!details.seo.description?.ar || !details.seo.description.en)
    warnings.push({ path: 'seo.description', message: 'SEO description is incomplete' });
  if (!details.instructor.name.ar && !details.instructor.name.en)
    warnings.push({ path: 'instructor', message: 'Instructor details are missing' });
  if (!details.gallery?.length) warnings.push({ path: 'gallery', message: 'Gallery is empty' });
  if (details.enrollment.registrationOpen && !details.enrollment.capacity)
    warnings.push({
      path: 'enrollment.capacity',
      message: 'Registration is open without capacity information',
    });
  return { errors, warnings };
}
