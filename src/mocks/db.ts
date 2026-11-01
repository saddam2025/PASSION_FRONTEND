// MOCK: browser-persisted workflow store; replace with APIs in A4.
import type { Enrollment, Lead } from '@/schemas/lead';
import type { PaymentRecord } from '@/schemas/payment';
import type { AuditAction } from '@/schemas/audit';
import { redact } from '@/schemas/audit';
import type { UserPermission, AuthUser } from '@/services/auth.types';
import type { CourseDetails, Snapshot } from '@/schemas/course';
import type { PageConfig } from '@/schemas/sections';
import { MockDatabaseSchema } from './db.schema';
import { createInitialMockDatabase } from './db.seed';

export interface MockInvite {
  id: string;
  email: string;
  name?: string;
  permissions: UserPermission[];
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedAt?: string;
}
export interface MockNote {
  id: string;
  leadId?: string;
  enrollmentId?: string;
  authorId: string;
  body: string;
  createdAt: string;
}
export interface MockResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string;
}
export interface MockAuditEvent {
  id: string;
  actorId: string;
  action: string;
  entityId: string;
  at: string;
  entityType?: string;
  from?: string;
  to?: string;
  note?: string;
  metadata?: unknown;
}
export interface MockSettings {
  version: number;
  values: Record<string, unknown>;
  policyVersion: number;
}

export interface MockCourseRecord {
  id: string;
  slug: string;
  slugHistory: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  featured?: boolean;
  details: CourseDetails;
  pageConfig: PageConfig;
  draft?: Snapshot;
}

export interface MockDatabase {
  schemaVersion: 2;
  courses: MockCourseRecord[];
  audit: MockAuditEvent[];
  leads: Lead[];
  enrollments: Enrollment[];
  payments: PaymentRecord[];
  users: Array<
    AuthUser & {
      active: boolean;
      createdAt: string;
      lastLogin?: string;
      passwordSalt?: string;
      passwordHash?: string;
      failedLogins?: number;
      lockoutUntil?: number;
    }
  >;
  invites: MockInvite[];
  resetTokens: MockResetToken[];
  notes: MockNote[];
  alreadyRegisteredRefs: string[];
  demoIds?: { leads: string[]; enrollments: string[]; payments: string[] };
  settings: MockSettings;
}
const key = 'mock.db.v2';
const previousKey = 'mock.db.v1';
const staleKey = 'mock.force-stale-once';
const createValidatedSeed = () => MockDatabaseSchema.parse(createInitialMockDatabase());
export function readMockDb(): MockDatabase {
  if (typeof window === 'undefined') return createValidatedSeed();
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      const withoutRemovedNotifications = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? Object.fromEntries(Object.entries(parsed).filter(([field]) => field !== 'notifications'))
        : parsed;
      const validated = MockDatabaseSchema.safeParse(withoutRemovedNotifications);
      if (validated.success) return validated.data;
      if (import.meta.env.DEV) console.warn('MOCK database v2 is invalid; resetting to seed data.');
    } else if (import.meta.env.DEV) {
      const previous = window.localStorage.getItem(previousKey);
      console.warn(
        previous
          ? 'MOCK database v1 is obsolete; resetting to v2 seed data.'
          : 'MOCK database v2 is missing; creating seed data.',
      );
    }
    const seed = createValidatedSeed();
    window.localStorage.removeItem(previousKey);
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  } catch {
    if (import.meta.env.DEV)
      console.warn('MOCK database could not be loaded; resetting to seed data.');
    const seed = createValidatedSeed();
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
}
export function writeMockDb(db: MockDatabase): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(db));
}
export function resetMockDb(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(previousKey);
    window.localStorage.removeItem(staleKey);
  }
}
export function simulateStaleOnce(): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(staleKey, '1');
}
export function consumeStaleSimulation(): boolean {
  if (typeof window === 'undefined' || !import.meta.env.DEV) return false;
  const enabled = window.localStorage.getItem(staleKey) === '1';
  if (enabled) window.localStorage.removeItem(staleKey);
  return enabled;
}
export function recordMockAudit(
  db: MockDatabase,
  actorId: string,
  action: AuditAction,
  entityId: string,
  payload?: unknown,
): void {
  db.audit.unshift({
    id: crypto.randomUUID(),
    actorId,
    action,
    entityId,
    at: new Date().toISOString(),
    metadata: redact({ action, entityId, payload }),
  });
}

