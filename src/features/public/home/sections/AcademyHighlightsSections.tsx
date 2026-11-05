import type { ReactNode } from 'react';
import { Frame } from './shared';
import { getBilingualText, useLanguage } from '@/i18n/useLanguage';
import type { CourseSummary } from '@/services/courses.types';

const modeLabels = { online: 'عن بُعد', inPerson: 'حضوري', hybrid: 'هجين' } as const;

function HighlightCard({ children }: { children: ReactNode }) {
  return <article className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-card motion-reduce:transform-none sm:p-8"><span className="pointer-events-none absolute -end-16 -top-16 size-40 rounded-full bg-gradient-to-br from-primary/10 to-accent/15 blur-3xl transition-opacity group-hover:opacity-100" aria-hidden="true" />{children}</article>;
}

export function CourseModesSection({ courses }: { courses: CourseSummary[] }) {
  const counts = (['online', 'inPerson', 'hybrid'] as const).map((mode) => ({ mode, count: courses.filter((course) => course.deliveryMethod === mode).length })).filter((item) => item.count > 0);
  if (!counts.length) return null;
  return <Frame title="طرق حضور الكورسات" id="stack" anchorIds={['learning-modes']}>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{counts.map(({ mode, count }) => <HighlightCard key={mode}><span className="mb-5 grid size-11 place-items-center rounded-full bg-primary/10 font-bold text-primary-strong">{count}</span><h3 className="text-xl font-bold">{modeLabels[mode]}</h3><p className="mt-3 text-sm leading-relaxed text-muted">{count} من الكورسات المميزة بتتاح بالطريقة دي.</p></HighlightCard>)}</div>
  </Frame>;
}

export function CourseInstructorsSection({ courses }: { courses: CourseSummary[] }) {
  const { language } = useLanguage();
  const instructors = Array.from(new Map(courses.map((course) => {
    const name = getBilingualText(course.instructor?.name ?? course.instructorName, language);
    return [name.toLocaleLowerCase(), { name, title: getBilingualText(course.instructor?.title, language), courses: [] as string[] }] as const;
  }).filter(([key]) => key)).values());
  courses.forEach((course) => {
    const name = getBilingualText(course.instructor?.name ?? course.instructorName, language);
    const instructor = instructors.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (instructor && !instructor.courses.includes(getBilingualText(course.title, language))) instructor.courses.push(getBilingualText(course.title, language));
  });
  if (!instructors.length) return null;
  return <Frame title="مدربو الكورسات" id="partners">
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{instructors.map((instructor) => <HighlightCard key={instructor.name}><span className="mb-5 grid size-12 place-items-center rounded-full border border-primary/20 bg-primary/5 text-lg font-bold text-primary-strong">{instructor.name.slice(0, 1)}</span><h3 className="text-xl font-bold">{instructor.name}</h3>{instructor.title && <p className="mt-2 text-sm text-primary-strong">{instructor.title}</p>}<p className="mt-3 text-sm leading-relaxed text-muted">{instructor.courses.join('، ')}</p></HighlightCard>)}</div>
  </Frame>;
}

export function CourseAccreditationSection({ courses }: { courses: CourseSummary[] }) {
  const { language } = useLanguage();
  const verified = courses.filter((course) => course.accreditationVerified && (course.accreditation?.accreditingBody?.ar || course.accreditation?.statement?.ar || course.accreditation?.certificateType?.ar));
  if (!verified.length) return null;
  return <Frame title="اعتمادات الكورسات" id="governance">
    <div className="grid gap-5 sm:grid-cols-2">{verified.map((course) => <HighlightCard key={course.slug}><span className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary-strong">اعتماد مُتحقق منه</span><h3 className="text-xl font-bold">{getBilingualText(course.title, language)}</h3><p className="mt-3 text-sm leading-relaxed text-muted">{[course.accreditation?.accreditingBody, course.accreditation?.certificateType, course.accreditation?.statement].map((value) => getBilingualText(value, language)).filter(Boolean).join(' · ')}</p></HighlightCard>)}</div>
  </Frame>;
}
