import type { PageConfig } from '@/schemas/sections';
import type { CourseChange } from './diffCourseDetails';
export function diffPageConfig(before: PageConfig | null, after: PageConfig): CourseChange[] {
  const oldSections = before?.sections ?? [];
  const oldById = new Map(oldSections.map((section, index) => [section.id, { section, index }]));
  const newById = new Map(after.sections.map((section, index) => [section.id, { section, index }]));
  const changes: CourseChange[] = [];
  for (const [id, item] of newById) {
    const old = oldById.get(id);
    if (!old)
      changes.push({
        path: `sections.${id}`,
        before: null,
        after: item.section.type,
        kind: 'added',
      });
    else {
      if (old.index !== item.index)
        changes.push({
          path: `sections.${id}.position`,
          before: old.index + 1,
          after: item.index + 1,
          kind: 'changed',
        });
      if (JSON.stringify(old.section) !== JSON.stringify(item.section))
        changes.push({
          path: `sections.${id}.content`,
          before: old.section,
          after: item.section,
          kind: 'changed',
        });
    }
  }
  for (const [id, item] of oldById)
    if (!newById.has(id))
      changes.push({
        path: `sections.${id}`,
        before: item.section.type,
        after: null,
        kind: 'removed',
      });
  return changes;
}
