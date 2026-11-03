import { apiRequest } from '@/api/client';
import type { InviteService, PasswordResetService } from './authFlows.types';

export const apiInviteService: InviteService = {
  async validate(token) {
    try { const result = await apiRequest<{ email: string; role: 'assistant' }>(`auth/invites/${encodeURIComponent(token)}`); return { email: result.email }; }
    catch { return null; }
  },
  async accept(input) {
    await apiRequest('auth/invites/accept', { method: 'POST', body: JSON.stringify({ token: input.token, name: input.fullName, password: input.password }) });
  },
};

export const apiPasswordResetService: PasswordResetService = {
  async requestReset(email) { await apiRequest('auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }); },
  async resetPassword(token, password) { await apiRequest('auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) }); },
};
