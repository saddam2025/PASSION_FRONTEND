// MOCK: replace with notification API in A2/A3.
import { mockAuthService } from './auth.mock';
import { readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import { hasPermission } from '@/schemas/permissions';
export type NotificationType =
  | 'course_submitted'
  | 'revision_approved'
  | 'revision_rejected'
  | 'new_registration'
  | 'payment_recorded';
export interface NotificationItem {
  id: string;
  type: NotificationType;
  entityId: string;
  courseId?: string;
  recipientRole: 'admin' | 'assistant';
  recipientId?: string;
  createdAt: string;
  readAt: string | null;
}
export const notificationsService = {
  async list(input: { unread?: boolean; page?: number; pageSize?: number } = {}) {
    const user = await mockAuthService.getCurrentUser();
    if (!user) throw new Error('Authentication required');
    const db = readMockDb();
    const rows = db.notifications.filter(
      (item) =>
        item.recipientRole === user.role &&
        (item.type !== 'new_registration' || hasPermission(user, 'viewLeads')) &&
        (!item.recipientId || item.recipientId === user.id) &&
        (input.unread !== true || !item.readAt),
    );
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 15;
    return {
      items: rows.slice((page - 1) * pageSize, page * pageSize),
      total: rows.length,
      page,
      pageSize,
      pageCount: Math.ceil(rows.length / pageSize),
    };
  },
  async latest(limit = 5) {
    const result = await this.list({ pageSize: limit });
    return result.items;
  },
  async unreadCount() {
    const result = await this.list({ unread: true, pageSize: 1000 });
    return result.total;
  },
  async markRead(id: string) {
    const user = await mockAuthService.getCurrentUser();
    if (!user) throw new Error('Authentication required');
    const db = readMockDb();
    const item = db.notifications.find(
      (entry) =>
        entry.id === id &&
        entry.recipientRole === user.role &&
        (entry.type !== 'new_registration' || hasPermission(user, 'viewLeads')) &&
        (!entry.recipientId || entry.recipientId === user.id),
    );
    if (item) {
      item.readAt = new Date().toISOString();
      recordMockAudit(db, user.id, 'notification.read', id);
    }
    writeMockDb(db);
  },
  async markAllRead() {
    const user = await mockAuthService.getCurrentUser();
    if (!user) return;
    const db = readMockDb();
    const now = new Date().toISOString();
    db.notifications.forEach((item) => {
      if (
        item.recipientRole === user.role &&
        (item.type !== 'new_registration' || hasPermission(user, 'viewLeads')) &&
        (!item.recipientId || item.recipientId === user.id)
      )
        item.readAt ??= now;
    });
    recordMockAudit(db, user.id, 'notification.read_all', user.id);
    writeMockDb(db);
  },
};
