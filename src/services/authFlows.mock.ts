// MOCK: invite and reset records are hash-only; replace with transactional API in B3.
import type {
  InviteDetails,
  InviteInput,
  InviteService,
  PasswordResetService,
} from '@/services/authFlows.types';
import { acceptInvite, validateInviteToken, validatePasswordResetToken } from './admin.mock';
import { hashMockPassword } from './auth.mock';
import { readMockDb } from '@/mocks/db';
import { emailSchema, passwordSchema } from '@/schemas/auth';
export const mockInviteService: InviteService = {
  async validate(token: string): Promise<InviteDetails | null> {
    const invite = await validateInviteToken(token);
    return invite ? { email: invite.email } : null;
  },
  async accept(input: InviteInput) {
    const invite = await validateInviteToken(input.token);
    if (!invite || invite.email !== input.email.toLowerCase())
      throw new Error('Invalid invitation link');
    const password = await hashMockPassword(passwordSchema.parse(input.password));
    await acceptInvite(input.token, {
      name: { ar: input.fullName, en: input.fullName },
      ...{ passwordHash: password.hash, passwordSalt: password.salt },
    });
  },
};
export const mockPasswordResetService: PasswordResetService = {
  async requestReset(email: string) {
    emailSchema.parse(email);
  },
  async validateResetToken(token: string) {
    return Boolean(await validatePasswordResetToken(token));
  },
  async resetPassword(token: string, password: string) {
    const record = await validatePasswordResetToken(token);
    if (!record) throw new Error('Invalid reset token.');
    const db = readMockDb();
    const user = db.users.find((item) => item.id === record.userId);
    if (!user) throw new Error('Invalid reset token.');
    const hashed = await hashMockPassword(passwordSchema.parse(password));
    user.passwordHash = hashed.hash;
    user.passwordSalt = hashed.salt;
    record.usedAt = new Date().toISOString();
    (await import('@/mocks/db')).writeMockDb(db);
  },
};
