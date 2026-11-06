import { academyDateKey, addCalendarDays, dateKeyParts } from '@/lib/timezone';

export type AppliedRange = { from: string; to: string } | { all: true };
export type RangeIssue = 'incomplete' | 'reversed' | 'tooLong';

export function last30Days(today: string): { from: string; to: string } {
  return { from: addCalendarDays(today, -29), to: today };
}

export function validateRange(from: string, to: string, today: string): RangeIssue | null {
  if (!from || !to) return 'incomplete';
  try {
    dateKeyParts(from); dateKeyParts(to);
  } catch { return 'incomplete'; }
  if (from > to) return 'reversed';
  const safeTo = to > today ? today : to;
  const start = dateKeyParts(from);
  const end = dateKeyParts(safeTo);
  const count = (Date.UTC(end.year, end.month - 1, end.day) - Date.UTC(start.year, start.month - 1, start.day)) / 86_400_000 + 1;
  return count > 400 ? 'tooLong' : null;
}

export function clampFutureDate(value: string, today: string): { value: string; clamped: boolean } {
  try { dateKeyParts(value); } catch { return { value: '', clamped: false }; }
  return value > today ? { value: today, clamped: true } : { value, clamped: false };
}

export function presetRange(preset: '7d' | '30d' | '90d' | 'month' | 'all', today: string): AppliedRange {
  if (preset === 'all') return { all: true };
  if (preset === 'month') return { from: `${today.slice(0, 7)}-01`, to: today };
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  return { from: addCalendarDays(today, 1 - days), to: today };
}

export function parseAppliedRange(from: string | null, to: string | null, today: string, all = false): { range: AppliedRange; invalid: boolean } {
  if (all && !from && !to) return { range: { all: true }, invalid: false };
  if (from === null && to === null) return { range: last30Days(today), invalid: false };
  if (!from && !to) return { range: last30Days(today), invalid: false };
  if (!from || !to || to > today || validateRange(from, to, today)) return { range: last30Days(today), invalid: true };
  return { range: { from, to }, invalid: false };
}

export function todayInCairo(now = new Date()): string { return academyDateKey(now); }
