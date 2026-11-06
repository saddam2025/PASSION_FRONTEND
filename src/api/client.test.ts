import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, resetApiSessionForTests } from './client';

const json = (body: unknown, status = 200) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
describe('shared API client', () => {
  beforeEach(() => { resetApiSessionForTests(); });
  afterEach(() => { vi.unstubAllGlobals(); resetApiSessionForTests(); });

  it('fetches CSRF once and sends it with every mutation', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => { void init; return String(input).endsWith('/auth/csrf') ? json({ csrfToken: 'csrf-one' }) : json({ saved: true }); });
    vi.stubGlobal('fetch', fetchMock);
    await apiRequest('auth/login', { method: 'POST', body: JSON.stringify({ email: 'a@b.test' }) });
    await apiRequest('auth/logout', { method: 'POST' });
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/csrf'))).toHaveLength(1);
    for (const [, init] of fetchMock.mock.calls.filter(([url]) => !String(url).endsWith('/auth/csrf'))) {
      expect(new Headers(init?.headers).get('X-CSRF-Token')).toBe('csrf-one');
      expect(init?.credentials).toBe('include');
    }
  });

  it('shares one refresh across concurrent requests and retries each request once', async () => {
    let refreshes = 0;
    const counts = new Map<string, number>();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) return json({ csrfToken: 'csrf' });
      if (url.endsWith('/auth/refresh')) { refreshes += 1; await Promise.resolve(); return json({ user: {} }); }
      const count = (counts.get(url) ?? 0) + 1; counts.set(url, count);
      return count === 1 ? json({ error: { code: 'UNAUTHENTICATED', message: 'secret server text' } }, 401) : json({ ok: true });
    });
    vi.stubGlobal('fetch', fetchMock);
    const results = await Promise.all([apiRequest('users'), apiRequest('settings')]);
    expect(results).toEqual([{ ok: true }, { ok: true }]);
    expect(refreshes).toBe(1);
    expect([...counts.values()]).toEqual([2, 2]);
  });

  it('clears the in-memory session and redirects after refresh failure', async () => {
    const replace = vi.fn();
    const events: string[] = [];
    vi.stubGlobal('window', { location: { pathname: '/admin/users', search: '?p=2', hash: '', replace }, dispatchEvent: (event: Event) => { events.push(event.type); } });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) return json({ csrfToken: 'csrf' });
      return json({ error: { code: 'UNAUTHENTICATED' } }, 401);
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest('users')).rejects.toMatchObject({ status: 401 });
    expect(events).toContain('passion-auth-session-cleared');
    expect(replace).toHaveBeenCalledWith('/?sessionExpired=1&returnTo=%2Fadmin%2Fusers%3Fp%3D2');
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/users'))).toHaveLength(1);
  });

  it('does not refresh a staff session for public data endpoints', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => { void input; return json({ error: { code: 'NOT_FOUND' } }, 404); });
    vi.stubGlobal('fetch', fetchMock);
    for (const path of ['public/courses/missing', 'settings/public', 'categories/public']) {
      await expect(apiRequest(path)).rejects.toMatchObject({ status: 404 });
    }
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/auth/refresh'))).toBe(false);
  });

  it('maps known and unknown codes without exposing backend messages and extracts field paths', async () => {
    const fetchMock = vi.fn(async () => json({ error: { code: 'VALIDATION_ERROR', message: 'raw backend message', details: [{ path: ['email'], message: 'raw field text' }], requestId: 'request-1' } }, 422));
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest('auth/login', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR', requestId: 'request-1', message: 'راجع البيانات اللي دخلتها وحاول تاني.', fieldErrors: { email: 'راجع الحقل ده.' },
    });
    const unknown = new ApiError('UNRECOGNIZED', 400, undefined, 'id');
    expect(unknown.message).toBe('حصلت مشكلة، جرّب تاني');
    expect(unknown.message).not.toContain('raw');
    expect(new ApiError('UNAUTHENTICATED', 401).message).toBe('انتهت جلسة الدخول. سجّل دخولك تاني وبعدها جرّب النشر.');
  });

  it('refetches CSRF once when a mutation is rejected for CSRF', async () => {
    let csrfCalls = 0; let mutations = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) { csrfCalls += 1; return json({ csrfToken: `csrf-${csrfCalls}` }); }
      mutations += 1;
      return mutations === 1 ? json({ error: { code: 'CSRF_INVALID' } }, 403) : json({ ok: true });
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest('settings', { method: 'PATCH', body: '{}' })).resolves.toEqual({ ok: true });
    expect(csrfCalls).toBe(2);
    expect(mutations).toBe(2);
  });
});
