import type { Course, Snapshot } from '@/schemas/course';

/**
 * Deterministically serialize any JavaScript value so identical objects with
 * different key insertion orders generate the exact same canonical string.
 */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJsonStringify(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const entries = keys
    .filter((key) => record[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${canonicalJsonStringify(record[key])}`);

  return `{${entries.join(',')}}`;
}

/**
 * Compares two snapshots for content equality using canonical JSON representation.
 */
export function snapshotsDiffer(a: Snapshot | null, b: Snapshot | null): boolean {
  if (a === null && b === null) return false;
  if (a === null || b === null) return true;
  return canonicalJsonStringify(a) !== canonicalJsonStringify(b);
}

/**
 * Determines whether a course has unpublished changes.
 * Returns true only when status === 'published', published snapshot exists,
 * and draft differs from published.
 */
export function hasUnpublishedChanges(course: Course): boolean {
  if (course.status !== 'published' || !course.published) {
    return false;
  }
  return snapshotsDiffer(course.draft, course.published);
}
