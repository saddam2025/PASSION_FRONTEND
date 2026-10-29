import type { CourseRecord } from '@/schemas/course';
import type { Enrollment, Lead } from '@/schemas/lead';
import type { PaymentRecord, PaymentStatus } from '@/schemas/payment';

export type BucketSize = 'day' | 'week' | 'month';
export interface AnalyticsQuery {
  from: string;
  to: string;
  courseId?: string;
  currency?: string;
  bucket?: BucketSize;
  compare?: boolean;
}
export interface AnalyticsInput {
  leads: readonly Lead[];
  enrollments: readonly Enrollment[];
  paymentRecords: readonly PaymentRecord[];
  courses: readonly CourseRecord[];
  query: AnalyticsQuery;
  revisions?: readonly { status: string; courseId?: string }[];
}
export interface MoneyByCurrency {
  [currency: string]: number;
}
export interface AnalyticsKpis {
  publishedCourses: number;
  draftCourses: number;
  pendingRevisions: number;
  newLeads: number;
  uniqueCustomers: number;
  enrollments: number;
  paidEnrollments: number;
  partiallyPaid: number;
  unpaid: number;
  cancelled: number;
  collected: MoneyByCurrency;
  refunds: MoneyByCurrency;
  netRevenue: MoneyByCurrency;
  outstanding: MoneyByCurrency;
  conversion: number | null;
  conversionNumerator: number;
  conversionDenominator: number;
  recentCohortHint: boolean;
}
export interface TimeSeriesPoint {
  key: string;
  registrations: number;
  collected: MoneyByCurrency;
  refunds: MoneyByCurrency;
  net: MoneyByCurrency;
}
export interface FunnelStage {
  key: 'submitted' | 'contacted' | 'awaiting' | 'paid';
  count: number;
  dropOff: number;
  dropOffPercent: number | null;
}
export interface DistributionItem {
  key: string;
  count: number;
  percent: number;
}
export interface CoursePerformance {
  courseId: string;
  title: { ar: string; en: string };
  registrations: number;
  uniqueCustomers: number;
  paid: number;
  partial: number;
  unpaid: number;
  conversion: number | null;
  netRevenue: MoneyByCurrency;
  outstanding: MoneyByCurrency;
}
export interface SourcePerformance {
  source: string;
  registrations: number;
  paid: number;
  conversion: number | null;
}
export interface AnalyticsResult {
  query: AnalyticsQuery;
  kpis: AnalyticsKpis;
  timeSeries: TimeSeriesPoint[];
  funnel: FunnelStage[];
  distributions: {
    paymentStatus: DistributionItem[];
    followUp: DistributionItem[];
    courses: DistributionItem[];
  };
  coursePerformance: CoursePerformance[];
  sources: SourcePerformance[];
  compare?: AnalyticsResult;
  currencies: string[];
  defaultCurrency: string;
  courseOptions: Array<{ id: string; title: { ar: string; en: string } }>;
  hasAttribution: boolean;
  hasDemoData: boolean;
}
export interface CohortRow {
  enrollment: Enrollment;
  lead: Lead;
  status: PaymentStatus;
  records: readonly PaymentRecord[];
}
