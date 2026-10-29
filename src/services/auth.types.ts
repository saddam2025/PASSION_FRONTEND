import type { BilingualText } from '@/schemas';
import type { PermissionKey } from '@/schemas/permissions';

export type UserRole = 'admin' | 'assistant';
export type UserPermission = PermissionKey;
export interface AuthUser {
  id: string;
  name: BilingualText;
  email: string;
  role: UserRole;
  permissions: UserPermission[];
}
export interface LoginInput { email: string; password: string }
export interface AuthService {
  login(input: LoginInput): Promise<AuthUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}
