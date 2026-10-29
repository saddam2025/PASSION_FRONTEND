// MOCK-ONLY password hashing uses salted SHA-256; real argon2id arrives in B3.
import { mockUsers } from '@/mocks/seed.mock';
import { readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import type { AuthService, AuthUser, LoginInput } from '@/services/auth.types';
const sessionKey = 'passion-mock-session';
const credentials: Record<string, { salt: string; hash: string }> = {
  'admin@example.test': {
    salt: 'passion-mock-admin-v1',
    hash: '096151d275b0a1fd6c3dc0f7f0f3f0b643d27d366fd5bbb5f7d9af3520c87253',
  },
  'assistant@example.test': {
    salt: 'passion-mock-assistant-v1',
    hash: 'fc7f26ac96413aab56242df2ea07dfe8d0871505ab910f72a1c8c6d28857d025',
  },
};
export async function hashMockPassword(
  password: string,
  salt: string = crypto.randomUUID(),
): Promise<{ salt: string; hash: string }> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}${password}`),
  );
  return {
    salt,
    hash: [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join(''),
  };
}
function users() {
  const db = readMockDb();
  if (!db.users.length) {
    db.users = mockUsers.map((u) => {
      const credential = credentials[u.email];
      return {
        ...u,
        active: true,
        createdAt: new Date().toISOString(),
        passwordSalt: credential?.salt,
        passwordHash: credential?.hash,
        failedLogins: 0,
      };
    });
    writeMockDb(db);
  }
  return db.users;
}
function safe(user: ReturnType<typeof users>[number]): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  };
}
export const mockAuthService: AuthService = {
  async login(input: LoginInput): Promise<AuthUser> {
    const email = input.email.trim().toLowerCase();
    const list = users();
    const user = list.find((u) => u.email === email);
    const db = readMockDb();
    if (!user || !user.active) {
      recordMockAudit(db, 'anonymous', 'auth.login_failed', 'authentication');
      writeMockDb(db);
      throw new Error('Invalid email or password.');
    }
    const now = Date.now();
    if (user.lockoutUntil && user.lockoutUntil > now)
      throw new Error(
        `Too many attempts. Try again in ${Math.ceil((user.lockoutUntil - now) / 60000)} minutes.`,
      );
    const candidate = await hashMockPassword(
      input.password,
      user.passwordSalt ?? 'legacy-mock-salt',
    );
    if (!user.passwordHash || candidate.hash !== user.passwordHash) {
      user.failedLogins = (user.failedLogins ?? 0) + 1;
      if (user.failedLogins >= 5) {
        user.lockoutUntil = now + 15 * 60000;
        user.failedLogins = 0;
      }
      recordMockAudit(db, user.id, 'auth.login_failed', user.id);
      writeMockDb(db);
      throw new Error(
        user.lockoutUntil
          ? `Too many attempts. Try again in 15 minutes.`
          : 'Invalid email or password.',
      );
    }
    user.failedLogins = 0;
    user.lockoutUntil = undefined;
    user.lastLogin = new Date().toISOString();
    sessionStorage.setItem(sessionKey, user.id);
    recordMockAudit(db, user.id, 'auth.login_succeeded', user.id);
    writeMockDb(db);
    return safe(user);
  },
  async logout() {
    sessionStorage.removeItem(sessionKey);
  },
  async getCurrentUser(): Promise<AuthUser | null> {
    const id = sessionStorage.getItem(sessionKey);
    if (!id) return null;
    const user = users().find((u) => u.id === id && u.active);
    if (!user) {
      sessionStorage.removeItem(sessionKey);
      return null;
    }
    return safe(user);
  },
};
