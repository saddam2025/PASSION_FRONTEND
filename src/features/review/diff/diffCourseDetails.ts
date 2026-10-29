import type { CourseDetails } from '@/schemas/course';
export interface CourseChange {
  path: string;
  before: unknown;
  after: unknown;
  kind: 'changed' | 'added' | 'removed';
}
export interface WordDiffPart {
  text: string;
  kind: 'same' | 'added' | 'removed';
}
export function diffWords(before: string, after: string): WordDiffPart[] {
  const oldWords = before.match(/\S+\s*/g) ?? [];
  const newWords = after.match(/\S+\s*/g) ?? [];
  if (oldWords.length * newWords.length > 25_000)
    return [
      { text: before, kind: 'removed' },
      { text: after, kind: 'added' },
    ];
  const rows = oldWords.length + 1;
  const cols = newWords.length + 1;
  const table = Array.from({ length: rows }, () => new Uint16Array(cols));
  for (let i = oldWords.length - 1; i >= 0; i -= 1)
    for (let j = newWords.length - 1; j >= 0; j -= 1)
      table[i]![j] =
        oldWords[i] === newWords[j]
          ? table[i + 1]![j + 1]! + 1
          : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
  const parts: WordDiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < oldWords.length || j < newWords.length) {
    const kind =
      oldWords[i] === newWords[j]
        ? 'same'
        : i < oldWords.length && (j === newWords.length || table[i + 1]![j]! >= table[i]![j + 1]!)
          ? 'removed'
          : 'added';
    const value =
      kind === 'same' ? oldWords[i++]! : kind === 'removed' ? oldWords[i++]! : newWords[j++]!;
    const tail = parts.at(-1);
    if (tail?.kind === kind) tail.text += value;
    else parts.push({ text: value, kind });
  }
  return parts;
}
export function diffCourseDetails(
  before: CourseDetails | null,
  after: CourseDetails,
): CourseChange[] {
  const changes: CourseChange[] = [];
  const walk = (left: unknown, right: unknown, path: string) => {
    if (JSON.stringify(left) === JSON.stringify(right)) return;
    if (
      typeof left === 'object' &&
      left !== null &&
      typeof right === 'object' &&
      right !== null &&
      !Array.isArray(left) &&
      !Array.isArray(right)
    ) {
      const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
      for (const key of keys)
        walk(
          (left as Record<string, unknown>)[key],
          (right as Record<string, unknown>)[key],
          path ? `${path}.${key}` : key,
        );
    } else
      changes.push({
        path,
        before: left,
        after: right,
        kind: left === undefined ? 'added' : right === undefined ? 'removed' : 'changed',
      });
  };
  walk(before, after, '');
  return changes;
}
