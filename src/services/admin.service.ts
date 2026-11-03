import { apiAdminService } from './admin.api';

export interface PageResult<T> { items: T[]; total: number; page: number; pageSize: number }
export type UserListRow = Awaited<ReturnType<typeof apiAdminService.usersPage>>['items'][number];
export type InviteListRow = Awaited<ReturnType<typeof apiAdminService.invitesPage>>['items'][number];

export const adminService = {
  ...apiAdminService,
  async users(options?: Parameters<typeof apiAdminService.users>[0]) { return (await apiAdminService.usersPage(options ?? {})).items; },
  async invites() { return (await apiAdminService.invitesPage()).items; },
};
