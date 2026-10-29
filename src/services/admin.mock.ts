// MOCK: admin users, invitations, settings and audit support; replace in A3.
import { mockAuthService } from './auth.mock';
import { mockUsers } from '@/mocks/seed.mock';
import { readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import { rolePermissionDefaults, PermissionListSchema } from '@/schemas/permissions';
import { redact } from '@/schemas/audit';
import { validateSettingsSection } from '@/schemas/settings';
import type { AuthUser, UserPermission } from './auth.types';
import { emailSchema } from '@/schemas/auth';
async function admin() {
  const u = await mockAuthService.getCurrentUser();
  if (u?.role !== 'admin') throw new Error('Not permitted');
  return u;
}
const seedRecords = () =>
  mockUsers.map((u) => ({ ...u, active: true, createdAt: '2026-10-29T00:00:00.000Z' }));
function userRecords() {
  const db = readMockDb();
  if (!db.users.length) {
    db.users = seedRecords();
    writeMockDb(db);
  }
  return db.users;
}
function tokenHash(raw: string): Promise<string> {
  return crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(raw))
    .then((buffer) =>
      [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join(''),
    );
}
export const adminService = {
  async users() {
    await admin();
    return userRecords().map((user) => {
      const safe = { ...user };
      delete safe.passwordHash;
      delete safe.passwordSalt;
      return safe;
    });
  },
  async updatePermissions(id: string, permissions: UserPermission[]) {
    const actor = await admin();
    permissions = PermissionListSchema.parse(permissions);
    const db = readMockDb();
    const user = db.users.find((x) => x.id === id);
    if (!user) throw new Error('User not found');
    user.permissions =
      user.role === 'admin' ? [...rolePermissionDefaults.admin] : [...new Set(permissions)];
    recordMockAudit(db, actor.id, 'user.permissions_changed', id);
    writeMockDb(db);
    return user;
  },
  async changeRole(id: string, role: 'admin' | 'assistant') {
    const actor = await admin();
    if (id === actor.id) throw new Error('You cannot change your own role');
    const db = readMockDb();
    const user = db.users.find((x) => x.id === id);
    if (!user) throw new Error('User not found');
    const activeAdmins = db.users.filter((x) => x.role === 'admin' && x.active);
    if (user.role === 'admin' && activeAdmins.length <= 1)
      throw new Error('The last active Admin cannot be demoted');
    user.role = role;
    user.permissions =
      role === 'admin' ? [...rolePermissionDefaults.admin] : [...rolePermissionDefaults.assistant];
    recordMockAudit(db, actor.id, 'user.role_changed', id);
    writeMockDb(db);
    return user;
  },
  async setActive(id: string, active: boolean) {
    const actor = await admin();
    if (id === actor.id && !active) throw new Error('You cannot deactivate yourself');
    const db = readMockDb();
    const user = db.users.find((x) => x.id === id);
    if (!user) throw new Error('User not found');
    if (
      !active &&
      user.role === 'admin' &&
      db.users.filter((x) => x.role === 'admin' && x.active).length <= 1
    )
      throw new Error('The last active Admin cannot be deactivated');
    user.active = active;
    recordMockAudit(db, actor.id, active ? 'user.reactivated' : 'user.deactivated', id);
    writeMockDb(db);
    return user;
  },
  async invites() {
    await admin();
    return readMockDb().invites.map((invite) => {
      const { tokenHash, ...safe } = invite;
      void tokenHash;
      return {
        ...safe,
        status:
          invite.status === 'pending' && Date.parse(invite.expiresAt) < Date.now()
            ? 'expired'
            : invite.status,
      };
    });
  },
  async createInvite(
    email: string,
    name: string | undefined,
    permissions: UserPermission[],
    hours: 24 | 72 | 168,
  ) {
    const actor = await admin();
    const normalized = emailSchema.parse(email);
    permissions = PermissionListSchema.parse(permissions);
    const db = readMockDb();
    if (userRecords().some((u) => u.email === normalized))
      throw new Error('A user with this email already exists');
    const active = db.invites.find(
      (i) =>
        i.email === normalized && i.status === 'pending' && Date.parse(i.expiresAt) > Date.now(),
    );
    if (active) throw new Error('An active invite exists; use Resend');
    const raw = crypto.randomUUID() + crypto.randomUUID();
    const invite = {
      id: crypto.randomUUID(),
      email: normalized,
      name,
      permissions,
      tokenHash: await tokenHash(raw),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + hours * 3600000).toISOString(),
      invitedBy: actor.id,
      status: 'pending' as const,
    };
    db.invites.unshift(invite);
    recordMockAudit(db, actor.id, 'invite.created', invite.id);
    writeMockDb(db);
    return { invite, link: `/${document.documentElement.lang || 'ar'}/invite/${raw}` };
  },
  async resendInvite(id: string) {
    const actor = await admin();
    const db = readMockDb();
    const inv = db.invites.find((i) => i.id === id);
    if (!inv || inv.status !== 'pending') throw new Error('Invite cannot be resent');
    const raw = crypto.randomUUID() + crypto.randomUUID();
    inv.tokenHash = await tokenHash(raw);
    inv.createdAt = new Date().toISOString();
    inv.expiresAt = new Date(Date.now() + 72 * 3600000).toISOString();
    recordMockAudit(db, actor.id, 'invite.resent', id);
    writeMockDb(db);
    return `/${document.documentElement.lang || 'ar'}/invite/${raw}`;
  },
  async revokeInvite(id: string) {
    const actor = await admin();
    const db = readMockDb();
    const inv = db.invites.find((i) => i.id === id);
    if (!inv || inv.status !== 'pending') throw new Error('Invite cannot be revoked');
    inv.status = 'revoked';
    recordMockAudit(db, actor.id, 'invite.revoked', id);
    writeMockDb(db);
  },
  async deleteInvite(id: string) {
    const actor = await admin();
    const db = readMockDb();
    const inv = db.invites.find((i) => i.id === id);
    if (
      !inv ||
      !(
        inv.status === 'accepted' ||
        inv.status === 'revoked' ||
        Date.parse(inv.expiresAt) <= Date.now()
      )
    )
      throw new Error('Only expired, revoked, or accepted invites may be deleted');
    db.invites = db.invites.filter((item) => item.id !== id);
    recordMockAudit(db, actor.id, 'invite.deleted', id);
    writeMockDb(db);
  },
  async generatePasswordResetLink(id: string) {
    const actor = await admin();
    const db = readMockDb();
    const user = db.users.find((item) => item.id === id);
    if (!user) throw new Error('User not found');
    const raw = crypto.randomUUID() + crypto.randomUUID();
    db.resetTokens = db.resetTokens.filter(
      (token) => token.userId !== id || token.usedAt || Date.parse(token.expiresAt) <= Date.now(),
    );
    db.resetTokens.push({
      id: crypto.randomUUID(),
      userId: id,
      tokenHash: await tokenHash(raw),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    recordMockAudit(db, actor.id, 'user.password_reset_link', id);
    writeMockDb(db);
    return `/${document.documentElement.lang || 'ar'}/reset-password/${raw}`;
  },
  async saveSettings(key: string, value: unknown, baseVersion: number) {
    const actor = await admin();
    validateSettingsSection(key, value);
    const db = readMockDb();
    if (db.settings.version !== baseVersion)
      throw new Error('Settings changed since editing began');
    const before = db.settings.values[key];
    db.settings.values[key] = value;
    db.settings.version += 1;
    if (key === 'legal') db.settings.policyVersion += 1;
    recordMockAudit(db, actor.id, 'settings.updated', key);
    db.audit[0]!.metadata = redact({ before, after: value });
    writeMockDb(db);
    window.dispatchEvent(new Event('passion-settings-updated'));
    return db.settings;
  },
  async getSettings() {
    await admin();
    return readMockDb().settings;
  },
  async publicSettings() {
    return readMockDb().settings;
  },
};
export async function validateInviteToken(raw: string) {
  const db = readMockDb();
  const hash = await tokenHash(raw);
  const invite = db.invites.find(
    (i) => i.tokenHash === hash && i.status === 'pending' && Date.parse(i.expiresAt) > Date.now(),
  );
  return invite ? { email: invite.email, id: invite.id } : null;
}
export async function validatePasswordResetToken(raw: string) {
  const db = readMockDb();
  const hash = await tokenHash(raw);
  return (
    db.resetTokens.find(
      (token) =>
        token.tokenHash === hash && !token.usedAt && Date.parse(token.expiresAt) > Date.now(),
    ) ?? null
  );
}
export async function acceptInvite(
  raw: string,
  input: { name: AuthUser['name']; passwordHash: string; passwordSalt: string },
) {
  const match = await validateInviteToken(raw);
  if (!match) throw new Error('Invalid invitation link');
  const db = readMockDb();
  const invite = db.invites.find((i) => i.id === match.id);
  if (!invite) throw new Error('Invalid invitation link');
  const user = {
    id: crypto.randomUUID(),
    name: input.name,
    email: invite.email,
    role: 'assistant' as const,
    permissions: invite.permissions,
    active: true,
    createdAt: new Date().toISOString(),
    passwordHash: input.passwordHash,
    passwordSalt: input.passwordSalt,
  };
  db.users.unshift(user);
  invite.status = 'accepted';
  invite.acceptedAt = new Date().toISOString();
  recordMockAudit(db, user.id, 'invite.accepted', invite.id);
  writeMockDb(db);
}
