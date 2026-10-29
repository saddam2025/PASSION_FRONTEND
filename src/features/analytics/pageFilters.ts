import { dateKeyParts } from '@/lib/timezone';
import type { BucketSize } from '@/lib/analytics/types';

export const analyticsBucketValues: BucketSize[] = ['day', 'week', 'month'];

export function isAnalyticsDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  try {
    dateKeyParts(value);
    return true;
  } catch {
    return false;
  }
}
