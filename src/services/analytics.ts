// MOCK: replace with privacy-preserving aggregate API calls in A4.
import { readMockDb, writeMockDb, recordMockAudit } from '@/mocks/db';
import { mockAuthService } from './auth.mock';
import { hasPermission } from '@/schemas/permissions';
import { calculateAnalytics } from '@/lib/analytics';
import type { AnalyticsQuery } from '@/lib/analytics';

export class AnalyticsForbiddenError extends Error {
  readonly code = 'forbidden';
  constructor() {
    super('Analytics permission required.');
  }
}
async function authorize(permission: 'viewFinancialReports' | 'exportCsv') {
  const user = await mockAuthService.getCurrentUser();
  if (!user || !hasPermission(user, permission)) throw new AnalyticsForbiddenError();
  return user;
}
function latency() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 120));
}

export const analyticsService = {
  async query(query: AnalyticsQuery) {
    await authorize('viewFinancialReports');
    await latency();
    const db = readMockDb();
    const result = calculateAnalytics({
      query,
      leads: db.leads,
      enrollments: db.enrollments,
      paymentRecords: db.payments,
      courses: db.courses.filter((course) => !course.deletedAt),
      revisions: db.revisions,
    });
    const paymentSettings = db.settings.values.payments;
    const defaultCurrency =
      paymentSettings &&
      typeof paymentSettings === 'object' &&
      'defaultCurrency' in paymentSettings &&
      typeof paymentSettings.defaultCurrency === 'string'
        ? paymentSettings.defaultCurrency
        : 'EGP';
    return { ...result, defaultCurrency };
  },
  async auditExport() {
    const user = await authorize('exportCsv');
    if (!hasPermission(user, 'viewFinancialReports')) throw new AnalyticsForbiddenError();
    const db = readMockDb();
    recordMockAudit(db, user.id, 'export.csv', 'analytics', { area: 'analytics-summary' });
    writeMockDb(db);
  },
};
