import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readMockDb, resetMockDb, writeMockDb } from '@/mocks/db';
import { readCourses, writeCourses } from '@/services/courses/storage';
import { RegistrationServiceError } from './registrations.types';
import { registrationsService } from './registrations.mock';
import type { RegistrationSubmission } from './registrations.types';

const values = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
};
const baseRequest = (): RegistrationSubmission => ({
  courseSlug: 'executive-leadership',
  fullName: 'سارة علي',
  email: 'sara@example.test',
  phone: '+201012345678',
  answers: { 'experience-level': 'beginner' },
  consent: true,
  idempotencyKey: 'registration-test-key-1',
  honeypot: '',
  formStartedAt: Date.now() - 5000,
  attribution: {
    utm_source: 'search',
    utm_medium: 'cpc',
    utm_campaign: 'november',
    referrer: 'https://example.test/landing',
  },
});

describe('public registrations mock contract', () => {
  beforeEach(() => {
    values.clear();
    vi.stubGlobal('window', { localStorage: localStorageMock, setTimeout });
    resetMockDb();
    const seed = readMockDb();
    writeMockDb({ ...seed, leads: [], enrollments: [], audit: [] });
    writeCourses(readCourses());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns received with the same reference on idempotent replay and stores first-touch attribution', async () => {
    const input = baseRequest();
    const first = await registrationsService.submit(input);
    const replay = await registrationsService.submit(input);
    expect(first.status).toBe('received');
    expect(replay).toEqual(first);
    expect(readMockDb().enrollments).toHaveLength(1);
    expect(readMockDb().leads[0].attribution).toMatchObject({
      source: 'search', medium: 'cpc', campaign: 'november', landingSlug: 'executive-leadership',
    });
  });

  it('rejects reuse of an idempotency key with a changed payload', async () => {
    await registrationsService.submit(baseRequest());
    await expect(registrationsService.submit({
      ...baseRequest(),
      fullName: 'اسم مختلف',
    })).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    expect(readMockDb().enrollments).toHaveLength(1);
  });

  it('returns the same neutral acknowledgement for a duplicate active course registration', async () => {
    const first = await registrationsService.submit(baseRequest());
    const duplicate = await registrationsService.submit({
      ...baseRequest(),
      idempotencyKey: 'registration-test-key-2',
    });
    expect(duplicate).toEqual(first);
    expect(Object.keys(duplicate).sort()).toEqual(['reference', 'status']);
    expect(readMockDb().enrollments).toHaveLength(1);
  });

  it('returns a neutral honeypot acknowledgement without creating lead or enrollment records', async () => {
    const before = readMockDb();
    const response = await registrationsService.submit({ ...baseRequest(), honeypot: 'bot-filled' });
    expect(response.status).toBe('received');
    expect(response.reference).toMatch(/^PAS-/);
    expect(readMockDb().leads).toEqual(before.leads);
    expect(readMockDb().enrollments).toEqual(before.enrollments);
    expect(await registrationsService.getConfirmation(response.reference)).toBeNull();
  });

  it('returns typed unavailable and closed errors without persisting registration data', async () => {
    const before = readMockDb();
    await expect(registrationsService.submit({ ...baseRequest(), courseSlug: 'unknown-course' }))
      .rejects.toMatchObject({ code: 'COURSE_NOT_AVAILABLE' });

    const courses = readCourses();
    const course = courses.find((item) => item.slug === 'executive-leadership')!;
    const published = course.published!;
    writeCourses(courses.map((item) => item.id === course.id ? {
      ...item,
      published: { ...published, details: { ...published.details, enrollment: { ...published.details.enrollment, registrationOpen: false } } },
    } : item));
    await expect(registrationsService.submit({ ...baseRequest(), idempotencyKey: 'closed-key' }))
      .rejects.toMatchObject({ code: 'REGISTRATION_CLOSED' });
    expect(readMockDb().leads).toEqual(before.leads);
    expect(readMockDb().enrollments).toEqual(before.enrollments);
  });

  it('returns a typed full-course error after the published capacity is reached', async () => {
    const first = await registrationsService.submit(baseRequest());
    const courses = readCourses();
    const course = courses.find((item) => item.slug === 'executive-leadership')!;
    const published = course.published!;
    writeCourses(courses.map((item) => item.id === course.id ? {
      ...item,
      published: { ...published, details: { ...published.details, enrollment: { ...published.details.enrollment, capacity: 1 } } },
    } : item));
    await expect(registrationsService.submit({
      ...baseRequest(),
      fullName: 'محمد حسن',
      email: 'mohamed@example.test',
      phone: '+201011112222',
      idempotencyKey: 'full-course-key',
    })).rejects.toMatchObject({ code: 'COURSE_FULL' });
    expect(first.reference).toBeTruthy();
    expect(readMockDb().enrollments).toHaveLength(1);
  });

  it('returns typed validation errors and leaves entered answer values untouched on failure', async () => {
    const input = { ...baseRequest(), email: '', answers: { 'experience-level': 'beginner', note: 'بيانات كتبتها' } };
    const originalAnswers = structuredClone(input.answers);
    await expect(registrationsService.submit(input)).rejects.toBeInstanceOf(RegistrationServiceError);
    await expect(registrationsService.submit({ ...input, idempotencyKey: 'validation-key-2' }))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(input.answers).toEqual(originalAnswers);
    expect(readMockDb().enrollments).toHaveLength(0);
  });

  it('confirmation contains only the reference, Arabic course title, and received status', async () => {
    const submitted = await registrationsService.submit(baseRequest());
    expect(await registrationsService.getConfirmation(submitted.reference)).toEqual({
      reference: submitted.reference,
      courseTitle: { ar: 'القيادة التنفيذية الفعالة' },
      status: 'received',
    });
  });
});
