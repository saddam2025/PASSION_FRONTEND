import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetApiSessionForTests } from '@/api/client';
import { apiAdminService } from './admin.api';
import { mediaUrl, mediaVariantKeys } from '@/lib/mediaUrl';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
describe('integrated API adapters', () => {
  beforeEach(() => resetApiSessionForTests());
  afterEach(() => { vi.unstubAllGlobals(); resetApiSessionForTests(); });

  it('maps backend pagination shape directly for the screen and sends filters', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => { void input; return json({ items: [{ id: 'u1' }], total: 21, page: 2, pageSize: 20 }); });
    vi.stubGlobal('fetch', fetchMock);
    const result = await apiAdminService.usersPage({ search: 'سارة', role: 'assistant', active: true, page: 2 });
    expect(result).toMatchObject({ total: 21, page: 2, pageSize: 20, items: [{ id: 'u1' }] });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('page=2');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('active=true');
  });

  it('returns an invite link once without persisting it', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => String(input).endsWith('/auth/csrf') ? json({ csrfToken: 'csrf' }) : json({ invite: { id: 'i1' }, link: 'https://academy.example/ar/invite/one-time-secret-token' }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const result = await apiAdminService.createInvite('assistant@example.test', undefined, 72);
    expect(result.link).toBe('https://academy.example/ar/invite/one-time-secret-token');
    expect(Object.keys(result)).toEqual(['invite', 'link']);
  });

  it('resolves original and API variant keys against the configured public base', () => {
    vi.stubEnv('VITE_MEDIA_BASE_URL', 'https://media.example.test');
    const original = 'media/2026/11/0123456789abcdef.webp';
    expect(mediaUrl(original, 'thumb')).toContain('/media/2026/11/0123456789abcdef-thumb.webp');
    expect(mediaUrl('media/2026/11/0123456789abcdef-original.webp', 'media/2026/11/0123456789abcdef-thumb.webp')).toContain('-thumb.webp');    const storedOriginal = 'media/2026/11/5990825a96164d768956c9804742a441-original.webp';
    expect(mediaUrl(storedOriginal, 'large')).toBe('https://media.example.test/media/2026/11/5990825a96164d768956c9804742a441-large.webp');
    expect(mediaVariantKeys(storedOriginal)?.large).toBe('media/2026/11/5990825a96164d768956c9804742a441-large.webp');
    expect(mediaUrl('', undefined)).toBe('/images/course-cover-default.webp');
  });

  it('preserves the typed settings conflict and its details for the reload path', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => String(input).endsWith('/auth/csrf') ? json({ csrfToken: 'csrf' }) : json({ error: { code: 'CONFLICT', message: 'raw backend text', details: { currentVersion: 7 }, requestId: 'settings-7' } }, 409));
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiAdminService.saveSettings('seo', {}, 6)).rejects.toMatchObject({ status: 409, code: 'CONFLICT', requestId: 'settings-7', message: 'تم تعديل الإعدادات من مكان تاني.' });
  });
});
