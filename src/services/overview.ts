import { apiRequest } from '@/api/client';
import { academyDateKey, addCalendarDays } from '@/lib/timezone';
import { minorToMajor } from '@/lib/money';

export type OverviewPeriod = '7d' | '30d' | 'all' | 'range';
export interface OverviewQuery { period: OverviewPeriod; from?: string; to?: string; }
export interface OverviewData {
  period: OverviewPeriod;
  totalRegistrations: number;
  registrations: number;
  paid: number;
  unpaid: number;
  netRevenue: number;
  revenueByCurrency: Array<{ currency: 'EGP' | 'USD'; netRevenue: number; paidCount: number; unpaidCount: number }>;
  courses: Array<{ id: string; title: string; registrations: number; paid: number; revenue: number; currency: string; netByCurrency: { EGP: number; USD: number } }>;
}
interface OverviewResponse {
  totalRegistrations: number; registrations: number; paid: number; unpaid: number; netRevenue: number;
  revenueByCurrency?: Array<{ currency: 'EGP' | 'USD'; netRevenue: number; paidCount: number; unpaidCount: number }>;
  courses: Array<{ id: string; title: string | { ar?: string }; registrations: number; paid: number; revenue: number; currency: string; netByCurrency?: { EGP?: number; USD?: number } }>;
}

export function overviewQuery(query: OverviewQuery, now = new Date()): URLSearchParams {
  const today = academyDateKey(now);
  const from = query.period === '7d' ? addCalendarDays(today, -6)
    : query.period === '30d' ? addCalendarDays(today, -29)
      : query.period === 'range' ? query.from : undefined;
  const to = query.period === '7d' || query.period === '30d' ? today
    : query.period === 'range' ? query.to : undefined;
  return new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) });
}

export function mapOverviewResponse(response: OverviewResponse, period: OverviewPeriod): OverviewData {
  return {
    period,
    totalRegistrations: response.totalRegistrations,
    registrations: response.registrations,
    paid: response.paid,
    unpaid: response.unpaid,
    netRevenue: minorToMajor(response.netRevenue),
    revenueByCurrency: response.revenueByCurrency ?? [{ currency: 'EGP', netRevenue: response.netRevenue, paidCount: response.paid, unpaidCount: response.unpaid }],
    courses: response.courses.map((course) => ({
      ...course,
      title: typeof course.title === 'string' ? course.title : course.title.ar ?? '',
      revenue: minorToMajor(course.revenue),
      netByCurrency: {
        EGP: course.netByCurrency?.EGP ?? (course.currency === 'EGP' ? course.revenue : 0),
        USD: course.netByCurrency?.USD ?? (course.currency === 'USD' ? course.revenue : 0),
      },
    })),
  };
}

export const overviewService = {
  async get(query: OverviewQuery): Promise<OverviewData> {
    const params = overviewQuery(query);
    const suffix = params.size ? `?${params}` : '';
    const response = await apiRequest<OverviewResponse>(`admin/overview${suffix}`);
    return mapOverviewResponse(response, query.period);
  },
};
