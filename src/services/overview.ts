import { apiRequest } from '@/api/client';
import { academyDateKey, addCalendarDays } from '@/lib/timezone';
import { minorToMajor } from '@/lib/money';

export type OverviewPeriod = '7d' | '30d' | 'all' | 'range';
export interface OverviewQuery { period: OverviewPeriod; from?: string; to?: string; }
export interface OverviewChartsQuery { from?: string; to?: string; }
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

export interface OverviewChartPoint { bucket: string; registrations?: number; paid?: number; netRevenue?: number; }
export interface OverviewChartsData {
  range: { from: string; to: string; granularity: 'day' | 'week' | 'month' };
  registrationsSeries: Array<{ bucket: string; registrations: number; paid: number }>;
  revenueSeriesByCurrency: Array<{ currency: 'EGP' | 'USD'; series: Array<{ bucket: string; netRevenue: number }> }>;
  netRevenueByCurrency: Array<{ currency: 'EGP' | 'USD'; netRevenue: number }>;
  funnel: { registered: number; contacted: number; awaitingPayment: number; paid: number; cancelled: number };
  paymentStatusDistribution: Array<{ status: string; count: number }>;
  byCourse: Array<{ courseId: string | null; slug?: string | null; title: string; registrations: number; paid: number }>;
  byAudience?: Array<{ audience: string; registrations: number; paid: number }>;
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

export function chartQuery(query: OverviewChartsQuery): URLSearchParams {
  return new URLSearchParams({ ...(query.from ? { from: query.from } : {}), ...(query.to ? { to: query.to } : {}) });
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
  async get(query: OverviewQuery, signal?: AbortSignal): Promise<OverviewData> {
    const params = overviewQuery(query);
    const suffix = params.size ? `?${params}` : '';
    const response = await apiRequest<OverviewResponse>(`admin/overview${suffix}`, { signal });
    return mapOverviewResponse(response, query.period);
  },
  async getCharts(query: OverviewChartsQuery, signal?: AbortSignal): Promise<OverviewChartsData> {
    const params = chartQuery(query);
    const suffix = params.size ? `?${params}` : '';
    return apiRequest<OverviewChartsData>(`admin/overview/charts${suffix}`, { signal });
  },
};
