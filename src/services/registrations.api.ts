import { apiRequest, ApiError } from '@/api/client';
import { RegistrationServiceError, type RegistrationErrorCode, type RegistrationSubmission, type RegistrationsService } from '@/services/registrations.types';

const messages: Record<string, string> = {
  COURSE_NOT_AVAILABLE: 'الكورس ده مش متاح للتسجيل دلوقتي.',
  REGISTRATION_CLOSED: 'التسجيل في الكورس ده مقفول دلوقتي.',
  COURSE_FULL: 'الأماكن المتاحة في الكورس اكتملت.',
  VALIDATION_ERROR: 'راجع بيانات التسجيل وحاول تاني.',
  IDEMPOTENCY_KEY_REUSED: 'بيانات الطلب اتغيرت. حدّث الصفحة وابدأ التسجيل من جديد.',
  IDEMPOTENCY_CONFLICT: 'بيانات الطلب اتغيرت. حدّث الصفحة وابدأ التسجيل من جديد.',
  RATE_LIMITED: 'عدد المحاولات كبير. جرّب تاني بعد شوية.',
};
function mapError(error: unknown): RegistrationServiceError {
  if (error instanceof RegistrationServiceError) return error;
  const api = error instanceof ApiError ? error : null;
  const rawCode = api?.code ?? 'NETWORK_ERROR';
  const code: RegistrationErrorCode = rawCode === 'IDEMPOTENCY_KEY_REUSED' ? 'IDEMPOTENCY_CONFLICT'
    : rawCode === 'COURSE_NOT_AVAILABLE' || rawCode === 'REGISTRATION_CLOSED' || rawCode === 'COURSE_FULL' || rawCode === 'VALIDATION_ERROR' || rawCode === 'RATE_LIMITED' ? rawCode : 'NETWORK_ERROR';
  const details = api?.details;
  const fieldErrors = { ...(api?.fieldErrors ?? {}) };
  if (Array.isArray(details)) for (const item of details) {
    if (item && typeof item === 'object' && 'fieldId' in item && typeof (item as { fieldId: unknown }).fieldId === 'string') {
      fieldErrors[(item as { fieldId: string }).fieldId] = 'راجع الحقل ده.';
    }
  }
  return new RegistrationServiceError(code, messages[rawCode] ?? api?.message ?? 'تعذر إرسال التسجيل. اتأكد من اتصالك وحاول تاني.', fieldErrors);
}
export const apiRegistrationsService: RegistrationsService = {
  async submit(input: RegistrationSubmission) {
    const body = {
      courseSlug: input.courseSlug,
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      answers: Object.fromEntries(Object.entries(input.answers).filter(([, value]) => value !== undefined)),
      ...(input.consent !== undefined ? { consent: input.consent } : {}),
      idempotencyKey: input.idempotencyKey,
      website: input.honeypot,
      formStartedAt: input.formStartedAt,
      ...(input.attribution ? { attribution: input.attribution } : {}),
    };
    try {
      const result = await apiRequest<{ reference: string; status: 'received' }>('public/registrations', { method: 'POST', body: JSON.stringify(body) });
      if (!result.reference || result.status !== 'received') throw new RegistrationServiceError('VALIDATION_ERROR', 'تعذر تأكيد التسجيل. حاول تاني.');
      return result;
    } catch (error) { throw mapError(error); }
  },
  async getConfirmation(reference: string) {
    try {
      const data = await apiRequest<{ reference: string; courseTitle: { ar: string }; status: 'received' }>(`public/registrations/${encodeURIComponent(reference)}`);
      return data.reference && data.courseTitle?.ar ? data : null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw mapError(error);
    }
  },
};
