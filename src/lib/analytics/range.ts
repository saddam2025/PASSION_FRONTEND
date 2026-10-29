import { academyDateKey, addCalendarDays, dateKeyParts } from '@/lib/timezone';

export function currentMonthStart(date: string) {
  const { year, month } = dateKeyParts(date);
  return `${year}-${String(month).padStart(2, '0')}-01`;
}
export function defaultAnalyticsRange(now = new Date()) {
  const to = academyDateKey(now);
  return { from: addCalendarDays(to, -29), to };
}
