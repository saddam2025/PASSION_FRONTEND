export const ACADEMY_TIME_ZONE = 'Africa/Cairo';
export const ACADEMY_WEEK_START = 6; // Saturday, using JS Sunday=0.

function partsAt(date: Date, timeZone = ACADEMY_TIME_ZONE): Record<string, number> {
  return Object.fromEntries(
    new Intl.DateTimeFormat('ar-EG-u-ca-gregory-nu-latn', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
}

export function academyDateKey(date: Date | string): string {
  const parts = partsAt(new Date(date));
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function dateKeyParts(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) throw new Error('Expected an ISO calendar date.');
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() + 1 !== month ||
    normalized.getUTCDate() !== day
  )
    throw new Error('Invalid ISO calendar date.');
  return { year, month, day };
}

export function addCalendarDays(key: string, amount: number): string {
  const { year, month, day } = dateKeyParts(key);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function academyLocalMidnight(key: string): Date {
  const { year, month, day } = dateKeyParts(key);
  const wall = Date.UTC(year, month - 1, day);
  let guess = wall;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = partsAt(new Date(guess));
    const seenWall = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    guess += wall - seenWall;
  }
  return new Date(guess);
}

export function academyRange(from: string, to: string): { start: Date; endExclusive: Date } {
  if (from > to) throw new Error('The start date must not be after the end date.');
  return {
    start: academyLocalMidnight(from),
    endExclusive: academyLocalMidnight(addCalendarDays(to, 1)),
  };
}

export function inAcademyRange(value: string, from: string, to: string): boolean {
  const key = academyDateKey(value);
  return key >= from && key <= to;
}
