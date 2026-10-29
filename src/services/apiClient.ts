import i18n from '@/i18n';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
function messageFor(code: string): string {
  return i18n.t(`errors:${code}`);
}
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1';
function buildEndpoint(path: string): string {
  const base = apiBaseUrl.replace(/\/+$/, '');
  const relativePath = path.replace(/^\/+/, '');
  return /^https?:\/\//i.test(base)
    ? new URL(relativePath, `${base}/`).toString()
    : `${base}/${relativePath}`;
}

export async function apiRequest<TResponse>(
  path: string,
  init: RequestInit = {},
): Promise<TResponse> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  // The API layer can populate this header from a CSRF-token endpoint when the backend is integrated.
  const csrfToken = sessionStorage.getItem('csrf-token');
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);

  let response: Response;
  try {
    response = await fetch(buildEndpoint(path), { ...init, headers, credentials: 'include' });
  } catch {
    throw new ApiError(messageFor('network'), 0, 'NETWORK_ERROR');
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code =
      typeof payload === 'object' &&
      payload !== null &&
      'code' in payload &&
      typeof payload.code === 'string'
        ? payload.code
        : undefined;
    const normalizedPath = path.replace(/^\/+/, '').toLowerCase();
    if (
      response.status === 401 &&
      !normalizedPath.startsWith('auth/login') &&
      typeof window !== 'undefined'
    ) {
      const lang = document.documentElement.lang.startsWith('en') ? 'en' : 'ar';
      const sensitiveRoute = /\/(?:invite|reset-password)\/[^/]+/i.test(window.location.pathname);
      const returnTo = sensitiveRoute
        ? `/${lang}`
        : `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(
        `/${lang}/login?sessionExpired=1&returnTo=${encodeURIComponent(returnTo)}`,
      );
    }
    const key =
      response.status === 401
        ? 'sessionExpired'
        : response.status === 403
          ? 'forbidden'
          : response.status === 429
            ? 'rateLimited'
            : response.status >= 500
              ? 'serviceUnavailable'
              : 'generic';
    throw new ApiError(messageFor(key), response.status, code ?? key.toUpperCase());
  }
  return payload as TResponse;
}
