import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetApiSessionForTests } from '@/api/client';
import { apiRegistrationsService } from './registrations.api';

const submission = {
  courseSlug: 'coach-course',
  fullName: 'سلمى أحمد',
  email: 'salma@example.com',
  phone: '+201012345678',
  answers: { goal: 'تطوير مهاراتي', track: 'management', optIn: true, omitted: undefined },
  consent: true,
  idempotencyKey: 'f60e6190-0bf0-49a6-bc38-3766cb665129',
  honeypot: '',
  formStartedAt: 1_799_000_000_000,
  attribution: { utm_source: 'facebook', utm_campaign: 'november' },
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('public registration API adapter', () => {
  beforeEach(() => resetApiSessionForTests());
  afterEach(() => { vi.unstubAllGlobals(); resetApiSessionForTests(); });

  it('sends the backend contract body, empty website honeypot, and millisecond form time', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      if (url.endsWith('/auth/csrf')) return json({ csrfToken: 'csrf-test' });
      if (url.endsWith('/public/registrations')) return json({ reference: 'PAS-123456', status: 'received' }, 201);
      return json({ reference: 'PAS-123456', courseTitle: { ar: 'كورس الإدارة' }, status: 'received' });
    }));

    await expect(apiRegistrationsService.submit(submission)).resolves.toEqual({ reference: 'PAS-123456', status: 'received' });
    const post = calls.find((call) => call.url.endsWith('/public/registrations'))!;
    expect(post.init?.method).toBe('POST');
    expect(new Headers(post.init?.headers).get('X-CSRF-Token')).toBe('csrf-test');
    expect(JSON.parse(String(post.init?.body))).toEqual({
      courseSlug: 'coach-course', fullName: 'سلمى أحمد', email: 'salma@example.com', phone: '+201012345678',
      answers: { goal: 'تطوير مهاراتي', track: 'management', optIn: true }, consent: true,
      idempotencyKey: submission.idempotencyKey, website: '', formStartedAt: submission.formStartedAt,
      attribution: submission.attribution,
    });
    expect(calls.some((call) => call.url.endsWith('/public/registrations/PAS-123456'))).toBe(true);
  });

  it('does not treat the backend neutral anti-bot response as confirmed success', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) return json({ csrfToken: 'csrf-test' });
      if (url.endsWith('/public/registrations')) return json({ reference: 'PAS-NEUTRAL', status: 'received' }, 201);
      return json({ error: { code: 'NOT_FOUND' } }, 404);
    }));

    await expect(apiRegistrationsService.submit(submission)).rejects.toMatchObject({ code: 'SUBMISSION_NOT_CONFIRMED' });
  });

  it.each([
    ['COURSE_NOT_AVAILABLE', 404, 'الكورس ده مش متاح للتسجيل دلوقتي.'],
    ['REGISTRATION_CLOSED', 409, 'التسجيل في الكورس ده مقفول دلوقتي.'],
    ['COURSE_FULL', 409, 'الأماكن المتاحة في الكورس اكتملت.'],
    ['VALIDATION_ERROR', 422, 'راجع بيانات التسجيل وحاول تاني.'],
    ['RATE_LIMITED', 429, 'عدد المحاولات كبير. جرّب تاني بعد شوية.'],
    ['FORBIDDEN', 403, 'تعذر إرسال الطلب من الموقع الحالي. تواصل مع الأكاديمية.'],
    ['CORS_ORIGIN_DENIED', 403, 'تعذر إرسال الطلب من الموقع الحالي. تواصل مع الأكاديمية.'],
  ])('maps %s to Arabic feedback', async (code, status, message) => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).endsWith('/auth/csrf')
      ? json({ csrfToken: 'csrf-test' })
      : json({ error: { code, requestId: 'request-test', details: code === 'VALIDATION_ERROR' ? [{ fieldId: 'goal' }] : undefined } }, status)));
    await expect(apiRegistrationsService.submit(submission)).rejects.toMatchObject({
      code: code === 'CORS_ORIGIN_DENIED' || code === 'FORBIDDEN' ? 'ORIGIN_NOT_ALLOWED' : code,
      message,
      requestId: 'request-test',
      ...(code === 'VALIDATION_ERROR' ? { fieldErrors: { goal: 'راجع الحقل ده.' } } : {}),
    });
  });
});
