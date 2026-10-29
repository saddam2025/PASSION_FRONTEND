import { ACADEMY_WEEK_START, addCalendarDays, dateKeyParts } from '@/lib/timezone';
import type { BucketSize } from './types';

export function chooseBucket(from: string, to: string, override?: BucketSize): BucketSize {
  if (override) return override;
  const days =
    Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
  return days <= 31 ? 'day' : days <= 180 ? 'week' : 'month';
}

export function bucketKey(dateKey: string, bucket: BucketSize): string {
  if (bucket === 'day') return dateKey;
  const { year, month, day } = dateKeyParts(dateKey);
  if (bucket === 'month') return `${year}-${String(month).padStart(2, '0')}`;
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const back = (weekday - ACADEMY_WEEK_START + 7) % 7;
  return addCalendarDays(dateKey, -back);
}

export function bucketKeys(from: string, to: string, bucket: BucketSize): string[] {
  const keys: string[] = [];
  for (let day = from; day <= to; day = addCalendarDays(day, 1)) {
    const key = bucketKey(day, bucket);
    if (keys.at(-1) !== key) keys.push(key);
  }
  return keys;
}
