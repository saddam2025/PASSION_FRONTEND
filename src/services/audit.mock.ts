// MOCK: append-only audit stream, replaced in A3.
import { mockAuthService } from './auth.mock';
import { readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import { redact } from '@/schemas/audit';
import { academyDateKey } from '@/lib/timezone';
export const auditService = {
  async list(
    filters: {
      search?: string;
      action?: string;
      from?: string;
      to?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const user = await mockAuthService.getCurrentUser();
    if (user?.role !== 'admin') throw new Error('Not permitted');
    const db = readMockDb();
    const needle = (filters.search ?? '').toLowerCase();
    const rows = db.audit
      .filter(
        (event) =>
          (!filters.action || event.action.startsWith(filters.action)) &&
          (!filters.from || academyDateKey(event.at) >= filters.from) &&
          (!filters.to || academyDateKey(event.at) <= filters.to) &&
          (!needle ||
            `${event.action} ${event.entityId} ${event.note ?? ''}`.toLowerCase().includes(needle)),
      )
      .map((event) => ({ ...event, metadata: redact(event.metadata) }));
    const page = Math.max(filters.page ?? 1, 1),
      pageSize = Math.min(filters.pageSize ?? 25, 100);
    return {
      items: rows.slice((page - 1) * pageSize, page * pageSize),
      total: rows.length,
      page,
      pageSize,
    };
  },
  async export() {
    const user = await mockAuthService.getCurrentUser();
    if (user?.role !== 'admin') throw new Error('Not permitted');
    const db = readMockDb();
    recordMockAudit(db, user.id, 'export.csv', 'audit');
    writeMockDb(db);
    return db.audit.map((event) => ({ ...event, metadata: redact(event.metadata) }));
  },
};
