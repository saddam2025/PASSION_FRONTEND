import i18n from '@/i18n';

export interface ApiErrorBody {
  code: string;
  message?: string;
  details?: unknown;
  requestId?: string;
}

const errorMessages: Record<string, string> = {
  VALIDATION_ERROR: 'راجع البيانات اللي دخلتها وحاول تاني.',
  CSRF_INVALID: 'انتهت صلاحية الطلب. حدّث الصفحة وحاول تاني.',
  FORBIDDEN: 'مش مسموح لك تعمل الإجراء ده.',
  NOT_FOUND: 'المحتوى المطلوب مش موجود.',
  CONFLICT: 'البيانات اتعدلت من مكان تاني. حدّث الصفحة وحاول تاني.',
  SETTINGS_VERSION_CONFLICT: 'تم تعديل الإعدادات من مكان تاني.',
  LAST_ADMIN: 'لا يمكن إيقاف آخر مسؤول نشط.',
  SELF_DEACTIVATION: 'لا يمكنك إيقاف حسابك الحالي.',
  SELF_DEMOTION: 'لا يمكنك تغيير صلاحية حسابك الحالي.',
  ACTIVE_USER_EXISTS: 'فيه مستخدم بالحساب ده بالفعل.',
  PENDING_INVITE_EXISTS: 'فيه دعوة سارية للبريد ده بالفعل.',
  INVITE_CONFLICT: 'ما قدرناش ننشئ الدعوة. اتأكد إن مفيش حساب أو دعوة سارية للبريد ده.',
  MEDIA_IN_USE: 'لا يمكن حذف الصورة لأنها مستخدمة في محتوى.',
  MEDIA_TYPE_INVALID: 'نوع الملف ده مش مدعوم.',
  MEDIA_TOO_LARGE: 'حجم الملف أكبر من المسموح.',
  MEDIA_DIMENSIONS_INVALID: 'أبعاد الصورة غير مناسبة.',
  RECEIPT_TYPE_INVALID: 'ارفع صورة بصيغة JPEG أو PNG أو WebP أو GIF أو TIFF أو BMP أو AVIF أو HEIF، أو ملف PDF.',
  RECEIPT_TOO_LARGE: 'حجم الإيصال لازم يكون 8 ميجابايت أو أقل.',
  RATE_LIMITED: 'عدد المحاولات كبير. جرّب تاني بعد شوية.',
  SERVICE_UNAVAILABLE: 'الخدمة مش متاحة دلوقتي. جرّب تاني.',
  NETWORK_ERROR: 'تعذر الاتصال بالخدمة. اتأكد من اتصالك وحاول تاني.',
  REQUEST_TIMEOUT: 'الطلب استغرق وقت طويل. جرّب تاني.',
  generic: 'حصلت مشكلة، جرّب تاني',
};

export class ApiError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(
    readonly code: string,
    readonly status: number,
    readonly details?: unknown,
    readonly requestId?: string,
  ) {
    super(messageFor(code, details));
    this.name = 'ApiError';
    this.fieldErrors = fieldsFromDetails(details);
  }
}

function messageFor(code: string, details: unknown): string {
  if (code === 'VALIDATION_ERROR') return validationMessage(details) ?? errorMessages[code]!;
  if (code === 'CONFLICT' && details && typeof details === 'object' && 'usageCount' in details) return 'التصنيف مرتبط بكورسات ومش ممكن حذفه.';
  if (code === 'CONFLICT' && details && typeof details === 'object' && 'currentVersion' in details) return 'تم تعديل الإعدادات من مكان تاني.';
  if (code === 'CONFLICT') return 'فيه تعارض في البيانات. راجع القيم الحالية وحاول تاني.';
  return errorMessages[code] ?? errorMessages.generic;
}

function fieldsFromDetails(details: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (Array.isArray(details)) {
    for (const issue of details) {
      if (!issue || typeof issue !== 'object') continue;
      const item = issue as { path?: unknown; field?: unknown };
      const path = (Array.isArray(item.path) ? item.path.join('.') : item.field)?.toString().replace(/^body\./, '');
      if (typeof path === 'string' && path) result[path] = 'راجع الحقل ده.';
    }
  } else if (details && typeof details === 'object' && 'fieldErrors' in details) {
    const errors = (details as { fieldErrors?: unknown }).fieldErrors;
    if (errors && typeof errors === 'object') {
      for (const key of Object.keys(errors)) result[key] = 'راجع الحقل ده.';
    }
  }
  return result;
}

function validationMessage(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined;
  if (details.some((item) => item && typeof item === 'object' && 'field' in item && (item as { field?: unknown }).field === 'maxRows')) return 'عدد السجلات أكبر من حد التصدير. قلّل الفترة أو استخدم فلاتر إضافية.';
  const codes = details.map((item) => item && typeof item === 'object' && 'code' in item ? String((item as { code: unknown }).code) : '');
  if (codes.includes('unsupported_type')) return 'صيغة الصورة دي مش مدعومة. الصيغ المقبولة: JPEG وPNG وWebP وGIF وTIFF وAVIF وHEIF.';
  if (codes.includes('too_big') || codes.includes('LIMIT_FILE_SIZE')) return 'حجم الصورة لازم يكون 5 ميجابايت أو أقل.';
  if (codes.includes('pixel_limit') || codes.includes('invalid_image')) return 'أبعاد الصورة غير مناسبة أو الملف مش صالح.';
  return undefined;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
let csrfToken: string | null = null;
let csrfFlight: Promise<string> | null = null;
let refreshFlight: Promise<boolean> | null = null;

function endpoint(path: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}
export const apiEndpoint = endpoint;

async function payload(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  return response.json().catch(() => undefined);
}

function extractError(body: unknown, status: number): ApiError {
  const outer = body && typeof body === 'object' && 'error' in body
    ? (body as { error?: unknown }).error
    : body;
  if (outer && typeof outer === 'object') {
    const error = outer as ApiErrorBody;
    return new ApiError(error.code || 'generic', status, error.details, error.requestId);
  }
  return new ApiError(status >= 500 ? 'SERVICE_UNAVAILABLE' : 'generic', status);
}

async function getCsrf(force = false): Promise<string> {
  if (!force && csrfToken) return csrfToken;
  if (!force && csrfFlight) return csrfFlight;
  csrfFlight = (async () => {
    let response: Response;
    try {
      response = await fetch(endpoint('auth/csrf'), { credentials: 'include', signal: AbortSignal.timeout(15000) });
    } catch (error) {
      throw new ApiError(error instanceof DOMException && error.name === 'TimeoutError' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR', 0);
    }
    const body = await payload(response) as { csrfToken?: unknown } | undefined;
    if (!response.ok || typeof body?.csrfToken !== 'string') throw extractError(body, response.status);
    csrfToken = body.csrfToken;
    return csrfToken;
  })();
  try { return await csrfFlight; } finally { csrfFlight = null; }
}

const mutating = (method: string) => !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
const csrfRejected = (error: ApiError) => error.status === 403 && /CSRF/i.test(error.code);
const isAuthPath = (path: string) => /^auth\/(?:login|refresh|logout|csrf|me|invites|password-reset)/i.test(path.replace(/^\/+/, ''));

async function rawRequest(path: string, init: RequestInit, retryCsrf = true): Promise<unknown> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (mutating(method)) headers.set('X-CSRF-Token', await getCsrf());
  let response: Response;
  try {
    response = await fetch(endpoint(path), { ...init, method, headers, credentials: 'include', signal: init.signal ?? AbortSignal.timeout(30000) });
  } catch (error) {
    throw new ApiError(error instanceof DOMException && error.name === 'TimeoutError' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR', 0);
  }
  const body = await payload(response);
  if (!response.ok) {
    const error = extractError(body, response.status);
    if (retryCsrf && mutating(method) && csrfRejected(error)) {
      csrfToken = null;
      await getCsrf(true);
      return rawRequest(path, init, false);
    }
    throw error;
  }
  return body;
}

async function refreshSession(): Promise<boolean> {
  if (!refreshFlight) {
    refreshFlight = rawRequest('auth/refresh', { method: 'POST' })
      .then(() => true)
      .catch(() => false)
      .finally(() => { refreshFlight = null; });
  }
  return refreshFlight;
}

function clearSessionAndRedirect(): void {
  csrfToken = null;
  window.dispatchEvent(new Event('passion-auth-session-cleared'));
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const safeReturn = path.startsWith('/') && !path.startsWith('//') ? path : '/admin';
  window.location.replace(`/ar/login?sessionExpired=1&returnTo=${encodeURIComponent(safeReturn)}`);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await rawRequest(path, init) as T;
  } catch (cause) {
    const error = cause instanceof ApiError ? cause : new ApiError('generic', 0);
    if (error.status === 401 && !isAuthPath(path)) {
      if (await refreshSession()) {
        try { return await rawRequest(path, init) as T; }
        catch (retryCause) {
          const retryError = retryCause instanceof ApiError ? retryCause : new ApiError('generic', 0);
          if (retryError.status === 401) clearSessionAndRedirect();
          throw retryError;
        }
      }
      clearSessionAndRedirect();
    }
    throw error;
  }
}

export async function apiDownload(path: string): Promise<{ blob: Blob; filename?: string }> {
  const send = async (csrfRetry = true, authRetry = true): Promise<{ blob: Blob; filename?: string }> => {
    const headers = new Headers({ 'X-CSRF-Token': await getCsrf() });
    let response: Response;
    try { response = await fetch(endpoint(path), { method: 'GET', credentials: 'include', headers, signal: AbortSignal.timeout(60_000) }); }
    catch (error) { throw new ApiError(error instanceof DOMException && error.name === 'TimeoutError' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR', 0); }
    if (!response.ok) {
      const error = extractError(await payload(response), response.status);
      if (csrfRetry && csrfRejected(error)) { csrfToken = null; await getCsrf(true); return send(false, authRetry); }
      if (error.status === 401 && authRetry && await refreshSession()) return send(false, false);
      if (error.status === 401) clearSessionAndRedirect();
      throw error;
    }
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    let filename = plain;
    if (encoded) { try { filename = decodeURIComponent(encoded); } catch { filename = undefined; } }
    return { blob: await response.blob(), ...(filename ? { filename: filename.replace(/[\\/\r\n]/g, '') } : {}) };
  };
  return send();
}

export async function apiUpload<T>(path: string, form: FormData, onProgress?: (percent: number) => void): Promise<T> {
  const send = async (csrfRetry = true, authRetry = true): Promise<T> => {
    const token = await getCsrf();
    const xhr = new XMLHttpRequest();
    const result = await new Promise<{ status: number; body: unknown }>((resolve, reject) => {
      xhr.open('POST', endpoint(path));
      xhr.withCredentials = true;
      xhr.timeout = 60_000;
      xhr.setRequestHeader('X-CSRF-Token', token);
      xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress?.(Math.round(event.loaded / event.total * 100)); };
      xhr.onerror = () => reject(new ApiError('NETWORK_ERROR', 0));
      xhr.ontimeout = () => reject(new ApiError('REQUEST_TIMEOUT', 0));
      xhr.onload = () => { let body: unknown; try { body = JSON.parse(xhr.responseText); } catch { body = undefined; } resolve({ status: xhr.status, body }); };
      xhr.send(form);
    });
    if (result.status >= 200 && result.status < 300) { onProgress?.(100); return result.body as T; }
    const error = extractError(result.body, result.status);
    if (csrfRetry && csrfRejected(error)) { csrfToken = null; await getCsrf(true); return send(false); }
    if (error.status === 401 && authRetry && await refreshSession()) return send(false, false);
    if (error.status === 401) clearSessionAndRedirect();
    throw error;
  };
  return send();
}

export function resetApiSessionForTests(): void { csrfToken = null; csrfFlight = null; refreshFlight = null; }
export const apiErrorMessage = (error: unknown): string => error instanceof ApiError ? error.message : i18n.t('errors:generic');
