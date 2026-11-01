import { CourseSchema, type Course } from '@/schemas/course';
import { createSeedCourses } from './seed';

export const COURSES_STORAGE_KEY = 'passion.courses.v2';

/**
 * Attempts to repair common minor schema defects before dropping.
 */
function tryRepairCourse(raw: unknown): Course | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = { ...(raw as Record<string, unknown>) };
  for (const obsolete of ['versions', 'review', 'reviewState', 'publishedVersion', 'deletionRequest']) delete item[obsolete];
  const repairSnapshot = (snapshot: unknown) => {
    if (!snapshot || typeof snapshot !== 'object') return;
    const page = (snapshot as { page?: { sections?: unknown[] } }).page;
    const allowedTypes = new Set(['hero', 'imageText', 'text', 'featureCards', 'curriculum', 'instructor', 'pricingCta', 'steps', 'faq', 'registrationForm', 'contactWhatsApp', 'banner']);
    if (page && Array.isArray(page.sections)) {
      page.sections = page.sections.flatMap((entry) => {
        if (!entry || typeof entry !== 'object' || !allowedTypes.has(String((entry as { type?: unknown }).type))) return [];
        const section = entry as { type?: unknown; responsive?: unknown; settings?: Record<string, unknown>; content?: Record<string, unknown> };
        delete section.responsive;
        if (section.settings) {
          delete section.settings.dividerTop;
          delete section.settings.dividerBottom;
          delete section.settings.align;
          delete section.settings.anchorId;
        }
        if (section.type === 'hero' && section.content) {
          delete section.content.mediaType;
          delete section.content.video;
          delete section.content.badgeImage;
        }
        if (section.type === 'imageText' && section.content) {
          delete section.content.mediaType;
          delete section.content.video;
          delete section.content.verticalAlign;
          if (Array.isArray(section.content.checklist)) {
            section.content.checklist = section.content.checklist.map((entry) => {
              if (!entry || typeof entry !== 'object') return entry;
              const migrated = { ...(entry as Record<string, unknown>) };
              delete migrated.icon;
              return migrated;
            });
          }
          if (!section.content.image || typeof section.content.image !== 'object') {
            section.content.image = { src: '/images/course-cover-default.webp', alt: { ar: '', en: '' }, decorative: true };
          }
        }
        return [section];
      });
    }
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
  for (const snapshot of [item.draft, item.published]) {
    const pricing = (snapshot as { details?: { pricing?: Record<string, unknown> } } | null)?.details?.pricing;
    if (pricing) {
      delete pricing.paymentMethods;
      pricing.currency = 'EGP';
    }
  }

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


