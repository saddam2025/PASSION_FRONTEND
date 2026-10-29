import type { AnalyticsInput, SourcePerformance } from './types';
import { selectCohort } from './query';

export function calculateSources(input: AnalyticsInput): SourcePerformance[] {
  const cohort = selectCohort(input.leads, input.enrollments, input.paymentRecords, input.query);
  const groups = new Map<string, typeof cohort>();
  for (const row of cohort) {
    const raw = row.lead.attribution.source?.trim().toLowerCase() ?? '';
    const allowed = new Set([
      'facebook',
      'instagram',
      'google',
      'tiktok',
      'whatsapp',
      'email',
      'referral',
      'website',
      'organic',
      'campaign',
    ]);
    const source = raw ? (allowed.has(raw) ? raw : 'other_unknown') : 'direct_unknown';
    groups.set(source, [...(groups.get(source) ?? []), row]);
  }
  return [...groups]
    .map(([source, rows]) => {
      const paid = rows.filter((row) => row.status === 'paid').length;
      return {
        source,
        registrations: rows.length,
        paid,
        conversion: rows.length ? paid / rows.length : null,
      };
    })
    .sort((a, b) => b.registrations - a.registrations);
}
