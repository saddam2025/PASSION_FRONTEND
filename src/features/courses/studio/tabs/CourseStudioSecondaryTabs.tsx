import { CourseDetailsTab } from './CourseDetailsTab';
import { CourseFormTab } from './CourseFormTab';
import { CourseSeoTab } from './CourseSeoTab';
import type { Course, Snapshot } from '@/schemas/course';
import type { CourseTab } from '../CourseStudioShell';
export function CourseStudioSecondaryTabs({ course, tabKey, snapshot, onChange }: { course: Course; tabKey: Exclude<CourseTab, 'page'>; snapshot: Snapshot; onChange: (snapshot: Snapshot) => void }) {
  if (tabKey === 'details') return <CourseDetailsTab course={course} snapshot={snapshot} onChange={onChange} assistant={false}/>;
  if (tabKey === 'form') return <CourseFormTab course={course} snapshot={snapshot} onChange={onChange}/>;
  return <CourseSeoTab course={course} snapshot={snapshot} onChange={onChange}/>;
}

