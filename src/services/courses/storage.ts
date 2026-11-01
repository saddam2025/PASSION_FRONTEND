import { CourseSchema, type Course } from '@/schemas/course';
import { createSeedCourses } from './seed';

export const COURSES_STORAGE_KEY = 'passion.courses.v2';

/**
 * Attempts to repair common minor schema defects before dropping.
 */
function tryRepairCourse(raw: unknown): Course | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = { ...(raw as Record<string, unknown>) };
  const repairSnapshot = (snapshot: unknown) => {
    if (!snapshot || typeof snapshot !== 'object') return;
    const details = (snapshot as { details?: Record<string, unknown> }).details;
    const overrides = details?.whatsappOverrides as Record<string, unknown> | undefined;
    const contact = details?.contact as Record<string, unknown> | undefined;
    for (const record of [overrides, contact]) {
      for (const key of ['messageTemplate', 'whatsappMessageTemplate']) {
        const value = record?.[key] as { ar?: unknown } | undefined;
        if (typeof value?.ar === 'string') value.ar = value.ar.replaceAll('{{courseTitle}}', '{course}').replaceAll('{{name}}', '{name}').replaceAll('{{reference}}', '{reference}');
      }
    }
  };
  repairSnapshot(item.draft);
  repairSnapshot(item.published);
  if (Array.isArray(item.versions)) for (const version of item.versions) repairSnapshot((version as { snapshot?: unknown })?.snapshot);

  if (!item.id || typeof item.id !== 'string') item.id = crypto.randomUUID();
  if (!item.slug || typeof item.slug !== 'string') item.slug = `course-${item.id}`;
  if (!Array.isArray(item.slugHistory)) item.slugHistory = [];
  if (!['draft', 'published', 'archived'].includes(String(item.status))) {
    item.status = 'draft';
  }
  if (typeof item.featured !== 'boolean') item.featured = false;
  if (!item.createdBy || typeof item.createdBy !== 'string') item.createdBy = 'system';
  if (!item.createdAt || typeof item.createdAt !== 'string') item.createdAt = new Date().toISOString();
  if (!item.updatedAt || typeof item.updatedAt !== 'string') item.updatedAt = new Date().toISOString();
  if (typeof item.version !== 'number') item.version = 1;
  if (typeof item.publishedVersion !== 'number') item.publishedVersion = 0;
  if (!Array.isArray(item.versions)) item.versions = [];

  const parsed = CourseSchema.safeParse(item);
  return parsed.success ? parsed.data : null;
}

/**
 * Reads all courses from localStorage.
 * Handles missing data by reseeding.
 * Handles corrupted entries by repairing or dropping them without crashing.
 */
export function readCourses(): Course[] {
  if (typeof window === 'undefined') {
    return createSeedCourses();
  }

  try {
    const raw = window.localStorage.getItem(COURSES_STORAGE_KEY);
    if (!raw) {
      const seed = createSeedCourses();
      writeCourses(seed);
      return seed;
    }

    const parsedJson: unknown = JSON.parse(raw);
    if (!Array.isArray(parsedJson) || parsedJson.length === 0) {
      const seed = createSeedCourses();
      writeCourses(seed);
      return seed;
    }

    const validCourses: Course[] = [];
    let hadCorrupted = false;

    for (const item of parsedJson) {
      const result = CourseSchema.safeParse(item);
      if (result.success) {
        validCourses.push(result.data);
      } else {
        hadCorrupted = true;
        const repaired = tryRepairCourse(item);
        if (repaired) {
          validCourses.push(repaired);
        } else {
          console.warn('[CoursesStorage] Dropped unrepairable course record:', (item as { id?: string })?.id ?? 'unknown');
        }
      }
    }

    if (validCourses.length === 0) {
      const seed = createSeedCourses();
      writeCourses(seed);
      return seed;
    }

    if (hadCorrupted) {
      writeCourses(validCourses);
    }

    return validCourses;
  } catch (err) {
    console.warn('[CoursesStorage] Failed to read from localStorage, resetting to seed:', err);
    const seed = createSeedCourses();
    writeCourses(seed);
    return seed;
  }
}

/**
 * Persists course records to localStorage.
 */
export function writeCourses(courses: Course[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
  } catch (err) {
    console.error('[CoursesStorage] Failed to write courses to localStorage:', err);
  }
}

/**
 * Resets course records to initial seed data.
 */
export function resetCourses(): Course[] {
  const seed = createSeedCourses();
  writeCourses(seed);
  return seed;
}
