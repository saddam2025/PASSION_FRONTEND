// MOCK: remove in batch A4
import type { BilingualText } from '@/schemas';
import type { UserPermission, UserRole } from '@/services/auth.types';
import { rolePermissionDefaults } from '@/schemas/permissions';

export interface MockUser {
  id: string;
  name: BilingualText;
  email: string;
  role: UserRole;
  permissions: UserPermission[];
}

export const mockUsers: MockUser[] = [
  {
    id: 'mock-admin-001',
    name: { ar: 'مدير تجريبي', en: 'Sample Admin' },
    email: 'admin@example.test',
    role: 'admin',
    permissions: [...rolePermissionDefaults.admin] as UserPermission[],
  },
  {
    id: 'mock-assistant-001',
    name: { ar: 'مساعد تجريبي', en: 'Sample Assistant' },
    email: 'assistant@example.test',
    role: 'assistant',
    permissions: [...rolePermissionDefaults.assistant] as UserPermission[],
  },
];
