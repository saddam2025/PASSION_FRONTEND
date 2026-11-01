// MOCK: simple role-limited Admin overview; replace with the analytics API in the API phase.
import { mockAuthService } from './auth.mock';
import { readMockDb } from '@/mocks/db';
import { readCourses } from '@/services/courses/storage';
import { computePaymentStatus } from '@/schemas/payment';
import { academyDateKey, addCalendarDays, inAcademyRange } from '@/lib/timezone';

export type OverviewPeriod = '7d' | '30d' | 'all' | 'range';
export interface OverviewQuery { period: OverviewPeriod; from?: string; to?: string; }
export const overviewService = {
  async get(query: OverviewQuery) {
    const user = await mockAuthService.getCurrentUser();
    if (!user || user.role !== 'admin') throw new Error('Not permitted');
    const db = readMockDb(); const courses = readCourses().filter((course) => !course.deletedAt);
    const today = academyDateKey(new Date());
    const from = query.period === '7d' ? addCalendarDays(today, -6) : query.period === '30d' ? addCalendarDays(today, -29) : query.from;
    const to = query.period === '7d' || query.period === '30d' ? today : query.to;
    const inPeriod = (date: string) => query.period === 'all' || !from || !to || inAcademyRange(date, from, to);
    const enrollments = db.enrollments.filter((item) => inPeriod(item.registeredAt));
    const allPayments = db.payments.filter((payment) => payment.status === 'confirmed' && inPeriod(payment.receivedAt));
    const netRevenue = allPayments.reduce((sum, payment) => sum + (payment.kind === 'payment' ? payment.amount : -payment.amount), 0);
    const byCourse = courses.map((course) => {
      const rows = enrollments.filter((item) => item.courseId === course.id);
      const paid = rows.filter((item) => computePaymentStatus(item.priceSnapshot, db.payments.filter((payment) => payment.enrollmentId === item.id)) === 'paid').length;
      const registrationIds = new Set(rows.map((item) => item.id));
      const revenue = allPayments.filter((payment) => registrationIds.has(payment.enrollmentId)).reduce((sum, payment) => sum + (payment.kind === 'payment' ? payment.amount : -payment.amount), 0);
      return { id: course.id, title: course.draft.details.title.ar, registrations: rows.length, paid, revenue, currency: 'EGP' };
    }).filter((row) => row.registrations || row.revenue);
    const paid = enrollments.filter((item) => computePaymentStatus(item.priceSnapshot, db.payments.filter((payment) => payment.enrollmentId === item.id)) === 'paid').length;
    const unpaid = enrollments.filter((item) => item.enrollmentStatus !== 'cancelled' && computePaymentStatus(item.priceSnapshot, db.payments.filter((payment) => payment.enrollmentId === item.id)) !== 'paid').length;
    return { period: query.period, from: from ?? '', to: to ?? '', totalRegistrations: db.enrollments.length, registrations: enrollments.length, paid, unpaid, netRevenue, courses: byCourse };
  },
};

