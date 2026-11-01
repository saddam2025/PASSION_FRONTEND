// MOCK: keep this adapter aligned with PASSION_BACKEND/docs/API.md public registrations.
import { readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import { buildSubmissionSchema } from '@/lib/formSchema';
import { normalizePhone } from '@/lib/phone';
import { LeadSchema, EnrollmentSchema } from '@/schemas/lead';
import type {
  PublicRegistrationConfirmation,
  RegistrationSubmission,
  RegistrationsService,
} from '@/services/registrations.types';
import { RegistrationServiceError } from '@/services/registrations.types';
import { readCourses } from '@/services/courses/storage';

const referenceAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function makeReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `PAS-${[...bytes].map((byte) => referenceAlphabet[byte % referenceAlphabet.length]).join('')}`;
}
function failure(code: ConstructorParameters<typeof RegistrationServiceError>[0], message: string): never {
  throw new RegistrationServiceError(code, message);
}
function confirmation(reference: string, title: PublicRegistrationConfirmation['courseTitle']): PublicRegistrationConfirmation {
  return { reference, courseTitle: title, status: 'received' };
}
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
async function submissionHash(input: RegistrationSubmission): Promise<string> {
  const normalized = {
    courseSlug: input.courseSlug,
    fullName: input.fullName?.trim() ?? '',
    email: String(input.email ?? input.answers.email ?? '').trim().toLowerCase(),
    phone: input.phone?.trim() ?? String(input.answers.phone ?? '').trim(),
    answers: input.answers,
    consent: input.consent ?? input.answers.consent,
  };
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stableJson(normalized)));
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export const registrationsService: RegistrationsService = {
  async getConfirmation(reference) {
    const db = readMockDb();
    const enrollment = db.enrollments.find((item) => item.reference === reference);
    if (!enrollment) return null;
    return confirmation(enrollment.reference, { ar: enrollment.courseSnapshot.title.ar });
  },

  async submit(input: RegistrationSubmission) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 350));
    if (!input.courseSlug.trim() || !input.idempotencyKey.trim() || !Number.isFinite(input.formStartedAt)) {
      return failure('VALIDATION_ERROR', 'راجع بيانات التسجيل وحاول تاني.');
    }

    // A honeypot or too-fast request receives a neutral acknowledgement without persistence.
    if (input.honeypot || Date.now() - input.formStartedAt < 2000) {
      return { reference: makeReference(), status: 'received' };
    }

    const db = readMockDb();
    const normalizedEmail = String(input.email ?? input.answers.email ?? '').trim().toLowerCase();
    const payloadHash = await submissionHash(input);
    const retry = db.enrollments.find((item) => item.idempotencyKey === input.idempotencyKey);
    if (retry) {
      const lead = db.leads.find((item) => item.id === retry.leadId);
      if (retry.idempotencyPayloadHash
        ? retry.idempotencyPayloadHash !== payloadHash
        : retry.courseSnapshot.slug !== input.courseSlug || lead?.email !== normalizedEmail) {
        return failure('IDEMPOTENCY_CONFLICT', 'مفتاح الطلب مستخدم لبيانات مختلفة.');
      }
      return { reference: retry.reference, status: 'received' };
    }

    const course = readCourses().find(
      (item) => item.slug === input.courseSlug && item.status === 'published' && item.published !== null && !item.deletedAt,
    );
    if (!course?.published) return failure('COURSE_NOT_AVAILABLE', 'الكورس ده غير متاح حاليًا.');
    if (!course.published.details.enrollment.registrationOpen) {
      return failure('REGISTRATION_CLOSED', 'التسجيل في الكورس ده مقفول حاليًا.');
    }
    const activeCount = db.enrollments.filter(
      (item) => item.courseId === course.id && ['pending', 'confirmed'].includes(item.enrollmentStatus),
    ).length;
    const capacity = course.published.details.enrollment.capacity;
    if (capacity !== null && capacity !== undefined && activeCount >= capacity) {
      return failure('COURSE_FULL', 'الأماكن المتاحة في الكورس اكتملت.');
    }

    const answers = {
      ...input.answers,
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.consent !== undefined ? { consent: input.consent } : {}),
    };
    const parsed = buildSubmissionSchema(course.published.form).safeParse(answers);
    if (!parsed.success) return failure('VALIDATION_ERROR', 'راجع بيانات التسجيل وحاول تاني.');

    const values = parsed.data;
    const email = String(values.email).trim().toLowerCase();
    const phone = String(values.phone);
    let lead = db.leads.find((item) => item.email === email);
    if (!lead) {
      const phoneNormalized = normalizePhone(phone);
      const duplicate = db.leads.find((item) => item.phoneNormalized === phoneNormalized);
      const source = input.attribution;
      lead = LeadSchema.parse({
        id: crypto.randomUUID(),
        fullName: String(values.fullName).trim(),
        email,
        phone,
        phoneNormalized,
        createdAt: new Date().toISOString(),
        consent: { acceptedAt: new Date().toISOString(), policyVersion: db.settings.policyVersion },
        attribution: {
          source: source?.utm_source,
          medium: source?.utm_medium,
          campaign: source?.utm_campaign,
          referrer: source?.referrer,
          landingSlug: course.slug,
        },
        possibleDuplicateOf: duplicate?.id,
      });
      db.leads.unshift(lead);
    }

    const existing = db.enrollments.find(
      (item) =>
        item.leadId === lead!.id &&
        item.courseId === course.id &&
        ['pending', 'confirmed'].includes(item.enrollmentStatus),
    );
    if (existing) {
      return { reference: existing.reference, status: 'received' };
    }

    const now = new Date().toISOString();
    let reference = makeReference();
    while (db.enrollments.some((item) => item.reference === reference)) reference = makeReference();
    const snapshot = course.published;
    const price = snapshot.details.pricing.promo ?? snapshot.details.pricing.price ?? null;
    const enrollment = EnrollmentSchema.parse({
      id: crypto.randomUUID(),
      reference,
      leadId: lead.id,
      courseId: course.id,
      courseSnapshot: { title: snapshot.details.title, slug: course.slug },
      priceSnapshot: { amount: price, currency: snapshot.details.pricing.currency },
      formSnapshot: { fields: snapshot.form.fields.map(({ id, label, type }) => ({ id, label, type })) },
      answers: Object.fromEntries(Object.entries(values).filter(([key]) => key !== 'consent')),
      enrollmentStatus: 'pending',
      followUpStatus: 'new',
      registeredAt: now,
      idempotencyKey: input.idempotencyKey,
      idempotencyPayloadHash: payloadHash,
      history: [{ type: 'registered', actor: 'visitor', at: now }],
    });
    db.enrollments.unshift(enrollment);
    db.notifications.unshift({
      id: crypto.randomUUID(),
      type: 'new_registration',
      entityId: enrollment.id,
      courseId: course.id,
      recipientRole: 'admin',
      createdAt: now,
      readAt: null,
    });
    db.notifications.unshift({
      id: crypto.randomUUID(),
      type: 'new_registration',
      entityId: enrollment.id,
      courseId: course.id,
      recipientRole: 'assistant',
      createdAt: now,
      readAt: null,
    });
    recordMockAudit(db, 'visitor', 'enrollment.created', enrollment.id);
    writeMockDb(db);
    return { reference, status: 'received' };
  },
};
