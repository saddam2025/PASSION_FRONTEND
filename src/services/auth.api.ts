import { apiRequest } from '@/api/client';
import { rolePermissionDefaults } from '@/schemas/permissions';
import type { AuthService, AuthUser, LoginInput } from './auth.types';

type ApiUser = { id: string; name?: { ar?: string } | string; email: string; role: 'admin' | 'assistant' };
const mapUser = (user: ApiUser): AuthUser => ({
  id: user.id,
  name: { ar: typeof user.name === 'string' ? user.name : user.name?.ar ?? '', en: '' },
  email: user.email,
  role: user.role,
  permissions: [...rolePermissionDefaults[user.role]],
});
const userFrom = (result: { user: ApiUser }) => mapUser(result.user);

export const apiAuthService: AuthService & {
  refresh(): Promise<AuthUser>;
  changePassword(currentPassword: string, password: string): Promise<void>;
} = {
  async login(input: LoginInput) {
    const result = await apiRequest<{ user: ApiUser }>('auth/login', { method: 'POST', body: JSON.stringify(input) });
    return userFrom(result);
  },
  async logout() { await apiRequest<void>('auth/logout', { method: 'POST' }); },
  async getCurrentUser() {
    try { return userFrom(await apiRequest<{ user: ApiUser }>('auth/me')); }
    catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 401) {
        try { await apiRequest('auth/refresh', { method: 'POST' }); return userFrom(await apiRequest<{ user: ApiUser }>('auth/me')); }
        catch (refreshError) { if (refreshError instanceof Error && 'status' in refreshError && refreshError.status === 401) return null; throw refreshError; }
      }
      throw error;
    }
  },
  async refresh() { return userFrom(await apiRequest<{ user: ApiUser }>('auth/refresh', { method: 'POST' })); },
  async changePassword(currentPassword, password) {
    await apiRequest<void>('auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, password }) });
  },
};
