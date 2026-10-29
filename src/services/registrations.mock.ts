// MOCK: visitor registrations persist in the shared local mock DB; replace in A3.
import { readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import { buildSubmissionSchema } from '@/lib/formSchema';
import { normalizePhone } from '@/lib/phone';
import { LeadSchema, EnrollmentSchema } from '@/schemas/lead';
import type { RegistrationSubmission, RegistrationsService } from '@/services/registrations.types';
import { getMockCourseBySlug } from '@/mocks/courses';

const referenceAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function makeReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `PAS-${[...bytes].map((byte) => referenceAlphabet[byte % referenceAlphabet.length]).join('')}`;
}
const invalid = () => new Error('Unable to validate registration request.');
export const registrationsService: RegistrationsService = {
  async getConfirmation(reference) {
    const db = readMockDb();
    const enrollment = db.enrollments.find((item) => item.reference === reference);
    if (!enrollment) return null;
    const lead = db.leads.find((item) => item.id === enrollment.leadId);
    if (!lead) return null;
    return {
      reference: enrollment.reference,
      courseTitle: enrollment.courseSnapshot.title,
      firstName: lead.fullName.trim().split(/\s+/)[0] ?? '',
      alreadyRegistered: db.alreadyRegisteredRefs.includes(reference),
    };
  },
  async submit(input: RegistrationSubmission) {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    if (input.honeypot || Date.now() - input.renderedAt < 2000) throw invalid();
    const db = readMockDb();
    const stored = db.courses.find(
      (item) =>
        item.details.slug === input.courseSlug && item.status === 'published' && !item.deletedAt,
    );
    const fixture = getMockCourseBySlug(input.courseSlug);
    const form = stored?.details.registrationForm ?? fixture?.formDefinition;
    if (!stored || !stored.details.enrollment.registrationOpen || !form)
      throw new Error('Registration is closed.');
    const parsed = buildSubmissionSchema(form).safeParse({
      ...input.answers,
      consent: input.consent,
    });
    if (!parsed.success) throw new Error('Please check the registration fields.');
    const retry = db.enrollments.find((item) => item.idempotencyKey === input.idempotencyKey);
    if (retry) {
      const lead = db.leads.find((item) => item.id === retry.leadId);
      if (!db.alreadyRegisteredRefs.includes(retry.reference))
        db.alreadyRegisteredRefs.push(retry.reference);
      writeMockDb(db);
      return {
        reference: retry.reference,
        courseTitle: retry.courseSnapshot.title,
        firstName: lead?.fullName.trim().split(/\s+/)[0] ?? '',
        alreadyRegistered: true,
      };
    }
    const values = parsed.data;
    const email = String(values.email).toLowerCase();
    const phone = String(values.phone);
    let lead = db.leads.find((item) => item.email === email);
    if (!lead) {
      const phoneNormalized = normalizePhone(phone);
      const duplicate = db.leads.find((item) => item.phoneNormalized === phoneNormalized);
      lead = LeadSchema.parse({
        id: crypto.randomUUID(),
        fullName: String(values.fullName).trim(),
        email,
        phone,
        phoneNormalized,
        createdAt: new Date().toISOString(),
        consent: { acceptedAt: new Date().toISOString(), policyVersion: db.settings.policyVersion },
        attribution: input.attribution ?? {},
        possibleDuplicateOf: duplicate?.id,
      });
      db.leads.unshift(lead);
    }
    const existing = db.enrollments.find(
      (item) =>
        item.leadId === lead!.id &&
        item.courseId === stored.id &&
        ['pending', 'confirmed'].includes(item.enrollmentStatus),
    );
    if (existing) {
      db.alreadyRegisteredRefs.push(existing.reference);
      writeMockDb(db);
      return {
        reference: existing.reference,
        courseTitle: existing.courseSnapshot.title,
        firstName: lead.fullName.trim().split(/\s+/)[0] ?? '',
        alreadyRegistered: true,
      };
    }
    const now = new Date().toISOString();
    let reference = makeReference();
    while (db.enrollments.some((item) => item.reference === reference)) reference = makeReference();
    const price = stored.details.pricing.promoPrice ?? stored.details.pricing.price;
    const enrollment = EnrollmentSchema.parse({
      id: crypto.randomUUID(),
      reference,
      leadId: lead.id,
      courseId: stored.id,
      courseSnapshot: { title: stored.details.title, slug: stored.details.slug },
      priceSnapshot: { amount: price, currency: stored.details.pricing.currency },
      formSnapshot: { fields: form.fields.map(({ id, label, type }) => ({ id, label, type })) },
      answers: Object.fromEntries(
        Object.entries(values).filter(([key]) => !['consent'].includes(key)),
      ),
      enrollmentStatus: 'pending',
      followUpStatus: 'new',
      registeredAt: now,
      idempotencyKey: input.idempotencyKey,
      history: [{ type: 'registered', actor: 'visitor', at: now }],
    });
    db.enrollments.unshift(enrollment);
    db.notifications.unshift({
      id: crypto.randomUUID(),
      type: 'new_registration',
      entityId: enrollment.id,
      courseId: stored.id,
      recipientRole: 'admin',
      createdAt: now,
      readAt: null,
    });
    db.notifications.unshift({
      id: crypto.randomUUID(),
      type: 'new_registration',
      entityId: enrollment.id,
      courseId: stored.id,
      recipientRole: 'assistant',
      createdAt: now,
      readAt: null,
    });
    recordMockAudit(db, 'visitor', 'enrollment.created', enrollment.id);
    writeMockDb(db);
    return {
      reference,
      courseTitle: enrollment.courseSnapshot.title,
      firstName: lead.fullName.trim().split(/\s+/)[0] ?? '',
    };
  },
};
