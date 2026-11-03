import { apiRequest, ApiError } from '@/api/client';

type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
type ApiUser = { id: string; name: { ar: string }; email: string; role: 'admin' | 'assistant'; active: boolean; createdAt: string; lastLoginAt?: string };
type ApiInvite = { id: string; email: string; role: 'assistant'; status: 'pending' | 'accepted' | 'revoked' | 'expired'; createdAt: string; expiresAt: string };
type Category = { id: string; name: string; slug: string; order: number };
type StaffSettings = { version: number; academy: Record<string, unknown>; contact: Record<string, unknown>; social: Record<string, unknown>; messaging: Record<string, unknown>; registration: Record<string, unknown>; legal: Record<string, unknown>; seo: Record<string, unknown> };

export const apiAdminService = {
  async usersPage(options: { search?: string; role?: string; active?: boolean; page?: number } = {}) {
    const query = new URLSearchParams({ page: String(options.page ?? 1), pageSize: '20', ...(options.search ? { search: options.search } : {}), ...(options.role ? { role: options.role } : {}), ...(options.active === undefined ? {} : { active: String(options.active) }) });
    return apiRequest<Page<ApiUser>>(`users?${query}`);
  },
  async users(options: { search?: string; role?: string; active?: boolean; page?: number } = {}) {
    return (await this.usersPage(options)).items;
  },
  async setActive(id: string, active: boolean) {
    const action = active ? 'reactivate' : 'deactivate';
    let result: { user: ApiUser } | ApiUser;
    try { result = await apiRequest<{ user: ApiUser } | ApiUser>(`users/${encodeURIComponent(id)}/${action}`, { method: 'POST' }); }
    catch (error) { if (!active && error instanceof ApiError && error.status === 409) throw new ApiError('LAST_ADMIN', error.status, error.details, error.requestId); throw error; }
    return 'user' in result ? result.user : result;
  },
  async invitesPage(options: { search?: string; status?: string; page?: number } = {}) { const query = new URLSearchParams({ page: String(options.page ?? 1), pageSize: '20', ...(options.search ? { search: options.search } : {}), ...(options.status ? { status: options.status } : {}) }); return apiRequest<Page<ApiInvite>>(`invites?${query}`); },
  async invites() { return (await this.invitesPage()).items; },
  async createInvite(email: string, name?: string, hours: 24 | 72 | 168 = 72) {
    let result: { invite: ApiInvite; link: string };
    try { result = await apiRequest<{ invite: ApiInvite; link: string }>('invites', { method: 'POST', body: JSON.stringify({ email, ...(name ? { name } : {}), role: 'assistant', hours }) }); }
    catch (error) { if (error instanceof ApiError && error.status === 409) throw new ApiError('INVITE_CONFLICT', error.status, error.details, error.requestId); throw error; }
    return { invite: result.invite, link: result.link };
  },
  async resendInvite(id: string) { const result = await apiRequest<{ invite: ApiInvite; link: string }>(`invites/${encodeURIComponent(id)}/resend`, { method: 'POST' }); return result.link; },
  async revokeInvite(id: string) { await apiRequest<void>(`invites/${encodeURIComponent(id)}/revoke`, { method: 'POST' }); },
  async getSettings() {
    const [settings, categories] = await Promise.all([apiRequest<StaffSettings>('settings'), apiRequest<{ items: Category[] }>('categories/public')]);
    const privacy = settings.legal.privacyPolicy as { body?: unknown } | undefined;
    return { version: settings.version, policyVersion: 1, values: { ...settings, academy: { ...settings.academy, name: { ar: String(settings.academy.name ?? ''), en: '' } }, contact: { ...settings.contact, address: { ar: String(settings.contact.address ?? ''), en: '' }, openingHours: { ar: String(settings.contact.openingHours ?? ''), en: '' } }, messaging: { ...settings.messaging, registrationMessage: { ar: String(settings.messaging.registration ?? ''), en: '' } }, registration: { ...settings.registration, privacyPolicy: { ar: String(privacy?.body ?? ''), en: '' } }, seo: { ...settings.seo, description: { ar: String(settings.seo.description ?? ''), en: '' } }, categories: { items: categories.items } } };
  },
  async saveSettings(key: string, value: unknown, baseVersion: number) {
    if (key === 'categories') return saveCategories(value);
    if (key === 'registration') {
      const first = await apiRequest<StaffSettings>('settings', { method: 'PATCH', body: JSON.stringify({ expectedVersion: baseVersion, section: 'registration', value: { privacyUrl: String((value as { privacyUrl?: unknown }).privacyUrl ?? '') } }) });
      const legalValue = { privacyPolicy: { title: { ar: 'سياسة الخصوصية' }, body: toArabic((value as { privacyPolicy?: unknown }).privacyPolicy) } };
      const result = await apiRequest<StaffSettings>('settings', { method: 'PATCH', body: JSON.stringify({ expectedVersion: first.version, section: 'legal', value: legalValue }) });
      window.dispatchEvent(new Event('passion-settings-updated'));
      return { version: result.version, policyVersion: 1, values: result };
    }
    const apiKey = key;
    const apiValue = key === 'academy'
        ? { ...value as object, name: toArabic((value as { name?: unknown }).name) }
        : key === 'contact'
          ? { ...value as object, address: toArabic((value as { address?: unknown }).address), openingHours: toArabic((value as { openingHours?: unknown }).openingHours) }
          : key === 'messaging'
            ? { registration: toArabic((value as { registrationMessage?: unknown }).registrationMessage) }
            : key === 'seo'
              ? { ...value as object, description: toArabic((value as { description?: unknown }).description) }
              : value;
    const result = await apiRequest<StaffSettings>('settings', { method: 'PATCH', body: JSON.stringify({ expectedVersion: baseVersion, section: apiKey, value: apiValue }) });
    window.dispatchEvent(new Event('passion-settings-updated'));
    return { version: result.version, policyVersion: 1, values: result };
  },
  async publicSettings() {
    const result = await apiRequest<Record<string, unknown>>('settings/public');
    return { version: 0, policyVersion: 1, values: publicToValues(result) };
  },
};

function publicToValues(data: Record<string, unknown>) {
  const contact = (data.contact ?? {}) as Record<string, unknown>;
  const academyName = data.academyName ?? '';
  const seo = (data.seoDefaults ?? {}) as Record<string, unknown>;
  return {
    academy: { name: { ar: academyName, en: '' }, logo: data.logoKey ?? '' },
    contact: { ...contact, address: { ar: contact.address ?? '', en: '' }, openingHours: { ar: contact.openingHours ?? '', en: '' } },
    social: data.socialLinks ?? {},
    messaging: { registrationMessage: { ar: data.whatsappMessageTemplate ?? '', en: '' } },
    registration: { privacyUrl: '' }, seo: { ...seo, description: { ar: seo.description ?? '', en: '' } },
    legal: (data.legalPages ?? {}) as Record<string, unknown>,
  };
}
async function saveCategories(value: unknown) {
  const current = await apiRequest<{ items: Category[] }>('categories/public');
    const desired = Array.isArray((value as { items?: unknown[] })?.items) ? (value as { items: unknown[] }).items.map(categoryName).filter(Boolean) : [];
  const existing = current.items;
  const ids: string[] = [];
  for (let index = 0; index < desired.length; index += 1) {
    const name = desired[index]!;
    const byName = existing.find((item) => item.name === name);
    const byPosition = existing[index];
    if (byName) ids.push(byName.id);
    else if (byPosition) {
      const updated = await apiRequest<Category>(`categories/${encodeURIComponent(byPosition.id)}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      ids.push(updated.id);
    } else {
      const created = await apiRequest<Category>('categories', { method: 'POST', body: JSON.stringify({ name }) });
      ids.push(created.id);
    }
  }
  for (const category of existing) if (!ids.includes(category.id)) await apiRequest(`categories/${encodeURIComponent(category.id)}`, { method: 'DELETE' });
  if (ids.length) await apiRequest('categories/reorder', { method: 'POST', body: JSON.stringify({ ids }) });
  const after = await apiRequest<{ items: Category[] }>('categories/public');
  window.dispatchEvent(new Event('passion-settings-updated'));
  return { version: 0, policyVersion: 1, values: { categories: { items: after.items } } };
}
function categoryName(item: unknown): string {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object' && 'name' in item) { const name = (item as { name: unknown }).name; if (typeof name === 'string') return name.trim(); if (name && typeof name === 'object' && 'ar' in name) return String((name as { ar: unknown }).ar).trim(); }
  return '';
}
function toArabic(value: unknown): { ar: string } { if (typeof value === 'string') return { ar: value }; if (value && typeof value === 'object' && 'ar' in value) return { ar: String((value as { ar: unknown }).ar ?? '') }; return { ar: '' }; }
