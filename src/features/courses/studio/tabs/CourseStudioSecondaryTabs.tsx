import type { Course, Snapshot } from '@/schemas/course';
import type { CourseTab } from '../CourseStudioShell';
import { CourseDetailsTab } from './CourseDetailsTab';
import { CourseFormTab } from './CourseFormTab';
import { CourseSeoTab } from './CourseSeoTab';

export function CourseStudioSecondaryTabs({ course, tabKey, snapshot, onChange, assistant }: { course: Course; tabKey: Exclude<CourseTab, 'page'>; snapshot: Snapshot; onChange: (snapshot: Snapshot) => void; assistant: boolean }) {
  if (tabKey === 'details') return <CourseDetailsTab course={course} snapshot={snapshot} onChange={onChange} assistant={assistant} />;
  if (tabKey === 'form') return <CourseFormTab course={course} snapshot={snapshot} onChange={onChange} />;
  if (tabKey === 'seo') return <CourseSeoTab course={course} snapshot={snapshot} onChange={onChange} />;
  return <section className="grid gap-3 rounded-md border border-border bg-surface p-4"><h2 className="text-xl font-bold">سجل الإصدارات</h2>{course.versions.length ? course.versions.map((version) => <article key={`${version.version}-${version.publishedAt}`} className="flex flex-wrap justify-between gap-2 border-b border-border py-3"><span>الإصدار {version.version}</span><span className="text-sm text-muted">{new Date(version.publishedAt).toLocaleString('ar-EG-u-nu-latn')}</span><span>{version.snapshot.details.title.ar}</span></article>) : <p className="text-sm text-muted">لسه مفيش إصدارات منشورة.</p>}</section>;
}
