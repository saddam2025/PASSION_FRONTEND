// MOCK: bounded admin overview aggregates; replace with the overview API in A4.
import { mockAuthService } from './auth.mock';
import { readMockDb } from '@/mocks/db';
import { readCourses } from '@/services/courses/storage';
import { hasPermission } from '@/schemas/permissions';
import { computePaymentStatus } from '@/schemas/payment';
import { ACADEMY_TIME_ZONE, academyDateKey, addCalendarDays } from '@/lib/timezone';

export const overviewService = {
  async get() {
    const user = await mockAuthService.getCurrentUser();
    if (!user || user.role !== 'admin') throw new Error('Not permitted');
    const db = readMockDb();
    const courses = readCourses().filter((c) => !c.deletedAt);
    const now = Date.now();
    const pendingCourses = courses.filter((c) => c.review.state === 'pending');
    const rejectedCourses = courses.filter((c) => c.review.state === 'rejected');
    const waitingLeads = db.enrollments.filter(
      (item) =>
        item.followUpStatus === 'new' && now - Date.parse(item.registeredAt) >= 24 * 60 * 60 * 1000,
    );
    const waitingPayment = db.enrollments
      .filter((item) => {
        const records = db.payments.filter((payment) => payment.enrollmentId === item.id);
        return (
          item.enrollmentStatus !== 'cancelled' &&
          ['unpaid', 'pending', 'partially_paid'].includes(
            computePaymentStatus(item.priceSnapshot, records),
          )
        );
      })
      .sort((a, b) => Date.parse(a.registeredAt) - Date.parse(b.registeredAt));
    const dayEnd = academyDateKey(new Date());
    const registrations = Array.from({ length: 14 }, (_, index) => {
      const day = addCalendarDays(dayEnd, index - 13);
      return {
        day,
        count: db.enrollments.filter((item) => academyDateKey(item.registeredAt) === day).length,
      };
    });
    const leadMap = new Map(db.leads.map((lead) => [lead.id, lead]));
    const canViewLeads = hasPermission(user, 'viewLeads');
    const canViewPayments = hasPermission(user, 'viewPayments');
    const canViewFinancial = hasPermission(user, 'viewFinancialReports');
    const authors = new Map(db.users.map((record) => [record.id, record.name]));
    return {
      counts: {
        pendingReviews: pendingCourses.length,
        newLeads: waitingLeads.length,
        awaitingPayment: waitingPayment.length,
        drafts: courses.filter((item) => item.status === 'draft').length,
        rejected: rejectedCourses.length,
      },
      pending: pendingCourses.slice(0, 5).map((item) => ({
        id: item.id,
        courseId: item.id,
        course: item.draft.details.title,
        author: authors.get(item.createdBy) ?? { ar: '', en: '' },
        at: item.review.submittedAt ?? item.updatedAt,
      })),
      registrations: db.enrollments
        .slice()
        .sort((a, b) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt))
        .slice(0, 8)
        .map((item) => ({
          id: item.id,
          leadId: canViewLeads ? item.leadId : undefined,
          name: canViewLeads ? (leadMap.get(item.leadId)?.fullName ?? '') : '',
          course: item.courseSnapshot.title,
          at: item.registeredAt,
          enrollmentStatus: item.enrollmentStatus,
          paymentStatus: computePaymentStatus(
            item.priceSnapshot,
            db.payments.filter((row) => row.enrollmentId === item.id),
          ),
        })),
      awaiting: waitingPayment.slice(0, 5).map((item) => ({
        id: item.id,
        leadId: canViewLeads ? item.leadId : undefined,
        name: canViewLeads ? (leadMap.get(item.leadId)?.fullName ?? '') : '',
        course: item.courseSnapshot.title,
        at: item.registeredAt,
        amount: canViewPayments && canViewFinancial ? item.priceSnapshot.amount : null,
        currency: item.priceSnapshot.currency,
      })),
      activity: db.audit
        .slice(0, 10)
        .map((item) => ({ id: item.id, action: item.action, at: item.at })),
      registrations14d: registrations,
      canViewLeads,
      canViewPayments,
      academyTimeZone: ACADEMY_TIME_ZONE,
    };
  },
};
