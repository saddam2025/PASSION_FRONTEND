import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SnapshotSchema, type Snapshot } from '@/schemas/course';
import { SECTION_REGISTRY_META, type SectionType } from '@/schemas/sections';
import { appQueryClient } from '@/app/queryClient';
import { resetApiSessionForTests } from '@/api/client';
import { apiCoursesService, apiPublicCoursesService, asSnapshot, invalidateCourseCaches, mapAdminCourseListItem, mapPublicCoursePage } from './courses.api';
import { apiRegistrationsService } from './registrations.api';

const sectionTypes: SectionType[] = ['hero', 'imageText', 'text', 'instructor', 'featureCards', 'curriculum', 'pricingCta', 'faq', 'contactWhatsApp', 'registrationForm', 'steps', 'banner'];
function snapshot(): Snapshot {
  const sections = sectionTypes.map((type, index) => ({ id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, type, visible: true, content: SECTION_REGISTRY_META[type].defaultContent() }));
  return SnapshotSchema.parse({ details: {
    title: { ar: 'كورس تجريبي', en: '' }, shortDescription: { ar: 'وصف تجريبي', en: '' }, category: 'إدارة',
    instructor: { name: { ar: 'مدرب', en: '' }, title: { ar: '', en: '' }, bio: { ar: [], en: [] } },
    coverImage: { src: '/images/course-cover-default.webp', alt: { ar: 'غلاف', en: '' }, decorative: true },
    delivery: { method: 'online', location: { ar: '', en: '' }, attendanceNotes: { ar: '', en: '' } },
    schedule: { startDate: '', endDate: '', scheduleText: { ar: '', en: '' }, duration: { ar: 'أسبوع', en: '' } },
    pricing: { price: 120000, promo: null, currency: 'EGP', contactUs: false },
    enrollment: { registrationOpen: true, capacity: null }, accreditation: { text: { ar: '', en: '' }, verifiedByAcademy: false },
    whatsappOverrides: { number: '+201000000000', messageTemplate: { ar: 'أهلًا {name}', en: '' } },
  }, page: { schemaVersion: 1, sections }, form: { fields: [{ id: 'experience', type: 'text', label: { ar: 'الخبرة', en: '' }, required: false }] }, seo: { title: { ar: 'كورس تجريبي', en: '' }, description: { ar: 'وصف', en: '' }, noindex: false } });
}
function courseWire() {
  const draft = snapshot();
  return { id: '507f1f77bcf86cd799439011', slug: 'test-course', slugHistory: [], status: 'published', featured: true, createdBy: '507f1f77bcf86cd799439012', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), publishedAt: new Date().toISOString(), version: 4, deletedAt: null, draft, published: draft };
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('API course and public registration adapters', () => {
  beforeEach(() => { appQueryClient.clear(); resetApiSessionForTests(); });
  afterEach(() => { vi.unstubAllGlobals(); appQueryClient.clear(); resetApiSessionForTests(); });

  it('round-trips all twelve section types plus details, registration form and SEO', () => {
    const value = snapshot();
    expect(asSnapshot(value)).toEqual(value);
    expect(SnapshotSchema.parse(JSON.parse(JSON.stringify(value)))).toEqual(value);
    expect(value.page.sections.map((section) => section.type).sort()).toEqual([...sectionTypes].sort());
    const wire = courseWire();
    const item = mapAdminCourseListItem(wire);
    expect(item.version).toBe(4); expect(item.hasUnpublishedChanges).toBe(false); expect(item.title.ar).toBe('كورس تجريبي');
    const publicPage = mapPublicCoursePage({ slug: wire.slug, title: value.details.title, shortDescription: value.details.shortDescription, seoTitle: value.seo.title, seoDescription: value.seo.description, category: { ar: 'إدارة' }, instructorName: value.details.instructor.name, instructor: value.details.instructor, coverImage: value.details.coverImage, price: 120000, promoPrice: null, currency: 'EGP', startDate: '', duration: value.details.schedule.duration, deliveryMethod: 'online', publishedAt: wire.publishedAt, featured: true, accreditationVerified: false, delivery: value.details.delivery, schedule: value.details.schedule, accreditation: { verifiedByAcademy: false }, registrationOpen: true, pageConfig: value.page, formDefinition: value.form, whatsappNumber: '+201000000000', whatsappMessageTemplate: value.details.whatsappOverrides?.messageTemplate });
    expect(publicPage.pageConfig.sections.map((section) => section.type).sort()).toEqual([...sectionTypes].sort());
    expect(publicPage.formDefinition.fields[0]?.id).toBe('experience'); expect(publicPage.seoTitle?.ar).toBe('كورس تجريبي'); expect(publicPage.price).toBe(1200);
  });

  it('sends expectedVersion with the complete snapshot and maps a stale-version conflict', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/auth/csrf')) return json({ csrfToken: 'csrf' });
      return json({ error: { code: 'CONFLICT', message: 'stale', details: { currentVersion: 5 } } }, 409);
    }));
    const result = await apiCoursesService.saveDraft('507f1f77bcf86cd799439011', snapshot(), 4);
    expect(result.ok).toBe(false);
    const sent = JSON.parse(String(calls.at(-1)?.init?.body));
    expect(sent.expectedVersion).toBe(4); expect(sent.draft.page.sections).toHaveLength(12);
    expect(calls.at(-1)?.url).toContain('/courses/507f1f77bcf86cd799439011/draft');
  });

  it('creates the selected frontend template as a snapshot and routes publish readiness failures to the panel', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const wire = courseWire();
    vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/auth/csrf')) return json({ csrfToken: 'csrf' });
      if (String(url).endsWith('/courses')) return json({ course: wire }, 201);
      return json({ error: { code: 'VALIDATION_ERROR', details: [{ field: 'details.title', message: 'required' }] } }, 422);
    }));
    const created = await apiCoursesService.create({ title: { ar: 'تجريبي', en: '' }, category: 'إدارة', slug: 'test-course', template: 'full' });
    expect(created.ok).toBe(true);
    const createBody = JSON.parse(String(calls.at(-1)?.init?.body));
    expect(createBody.draft.page.sections.some((item: { type: string }) => item.type === 'imageText')).toBe(true);
    expect(createBody.draft.page.sections).toHaveLength(10);
    const publish = await apiCoursesService.publish('507f1f77bcf86cd799439011', 4);
    expect(publish).toMatchObject({ ok: false, code: 'READINESS_FAILED' });
    expect(JSON.parse(String(calls.at(-1)?.init?.body))).toEqual({ expectedVersion: 4 });
  });

  it('maps legacy slugs to replaceable redirects and unavailable public pages to notFound', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => String(url).endsWith('/old-course') ? json({ status: 'redirect', slug: 'new-course' }) : json({ error: { code: 'NOT_FOUND' } }, 404)));
    await expect(apiPublicCoursesService.getPublishedBySlug('old-course')).resolves.toEqual({ status: 'redirect', slug: 'new-course' });
    await expect(apiPublicCoursesService.getPublishedBySlug('unknown-course')).resolves.toEqual({ status: 'notFound' });
  });

  it('submits idempotent public registration data with canonical form answer ids and maps field errors', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/auth/csrf')) return json({ csrfToken: 'csrf' });
      return json({ error: { code: 'VALIDATION_ERROR', details: [{ fieldId: 'experience', reason: 'required' }] } }, 422);
    }));
    await expect(apiRegistrationsService.submit({ courseSlug: 'test-course', fullName: 'مها علي', email: 'maha@example.test', phone: '+201000000000', answers: { experience: 'سنتين' }, consent: true, idempotencyKey: 'stable-key', honeypot: '', formStartedAt: 1_800_000_000_000, attribution: { utm_campaign: 'launch' } })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', fieldErrors: { experience: 'راجع الحقل ده.' } });
    const sent = JSON.parse(String(calls.at(-1)?.init?.body));
    expect(calls.at(-1)?.url).toContain('/public/registrations');
    expect(sent.answers).toEqual({ experience: 'سنتين' }); expect(sent.idempotencyKey).toBe('stable-key'); expect(sent.website).toBe(''); expect(sent.formStartedAt).toBe(1_800_000_000_000); expect(sent.attribution.utm_campaign).toBe('launch');
  });

  it('confirms success only with reference and never expects PII', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ reference: 'PAS-234567', courseTitle: { ar: 'كورس تجريبي' }, status: 'received' })));
    await expect(apiRegistrationsService.getConfirmation('PAS-234567')).resolves.toEqual({ reference: 'PAS-234567', courseTitle: { ar: 'كورس تجريبي' }, status: 'received' });
  });

  it('invalidates course and public query caches after a mutation', () => {
    const invalidateQueries = vi.fn();
    invalidateCourseCaches({ invalidateQueries });
    expect(invalidateQueries.mock.calls.map(([arg]) => arg.queryKey)).toEqual([['public-courses'], ['public-course'], ['course'], ['courses-list']]);
  });
});
