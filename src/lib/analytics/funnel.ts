import type { AnalyticsInput, FunnelStage } from './types';
import { selectCohort } from './query';

export function calculateFunnel(input: AnalyticsInput): FunnelStage[] {
  const cohort = selectCohort(input.leads, input.enrollments, input.paymentRecords, input.query);
  const counts = [cohort.length, 0, 0, 0];
  for (const row of cohort) {
    const everContacted =
      row.enrollment.followUpStatus !== 'new' ||
      row.enrollment.history.some(
        (item) =>
          (item.type === 'follow_up' && item.to !== 'new') ||
          item.type === 'whatsapp_contact_logged',
      ) ||
      row.records.length > 0;
    const everAwaiting =
      row.enrollment.followUpStatus === 'awaiting_payment' ||
      row.enrollment.history.some((item) => item.to === 'awaiting_payment') ||
      row.records.length > 0;
    if (everContacted) counts[1] += 1;
    if (everAwaiting) counts[2] += 1;
    if (row.status === 'paid') counts[3] += 1;
  }
  const keys = ['submitted', 'contacted', 'awaiting', 'paid'] as const;
  return counts.map((count, index) => {
    const previous = counts[index - 1];
    const dropOff = index === 0 ? 0 : previous - count;
    return {
      key: keys[index],
      count,
      dropOff,
      dropOffPercent: index === 0 || previous === 0 ? null : dropOff / previous,
    };
  });
}
