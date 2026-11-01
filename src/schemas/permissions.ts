export const PermissionKey = {
  viewLeads: 'viewLeads',
  updateFollowUp: 'updateFollowUp',
  viewPayments: 'viewPayments',
  recordPayments: 'recordPayments',
  exportCsv: 'exportCsv',
  viewFinancialReports: 'viewFinancialReports',
  manageNotes: 'manageNotes',
  viewSettings: 'viewSettings',
} as const;
export type PermissionKey = (typeof PermissionKey)[keyof typeof PermissionKey];
export const PermissionKeySchema = z.enum([
  PermissionKey.viewLeads,
  PermissionKey.updateFollowUp,
  PermissionKey.viewPayments,
  PermissionKey.recordPayments,
  PermissionKey.exportCsv,
  PermissionKey.viewFinancialReports,
  PermissionKey.manageNotes,
  PermissionKey.viewSettings,
]);
export const rolePermissionDefaults = {
  admin: Object.keys(PermissionKey) as PermissionKey[],
  assistant: ['viewLeads', 'updateFollowUp', 'viewPayments', 'recordPayments', 'manageNotes'] as PermissionKey[],
} as const;
export interface PermissionUser {
  id: string;
  role: 'admin' | 'assistant';
  permissions: readonly PermissionKey[];
}
export function hasPermission(user: PermissionUser, key: PermissionKey): boolean {
  return user.role === 'admin' || rolePermissionDefaults.assistant.includes(key);
}
import { z } from 'zod';
