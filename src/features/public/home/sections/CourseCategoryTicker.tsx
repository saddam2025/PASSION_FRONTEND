import type { CourseSummary } from '@/services/courses.types';
import { getBilingualText, useLanguage } from '@/i18n/useLanguage';

export function CourseCategoryTicker({ courses }: { courses: CourseSummary[] }) {
  const { language } = useLanguage();
  const categories = Array.from(new Map(courses.map((course) => {
    const label = getBilingualText(course.category, language).trim();
    return [label.toLocaleLowerCase(), label] as const;
  })).values()).filter(Boolean);
  if (!categories.length) return null;
  const repeated = [...categories, ...categories];
  return <section id="stack-marquee" aria-label="مجالات الكورسات" className="scroll-mt-24 overflow-hidden border-y border-border/70 bg-surface/55 py-5">
    <div className="course-category-marquee flex w-max items-center gap-3 pe-3" aria-hidden="true">
      {repeated.map((label, index) => <span key={`${label}-${index}`} className="rounded-full border border-primary/15 bg-primary/5 px-5 py-2 text-sm font-semibold text-primary-strong">{label}</span>)}
    </div>
    <div className="sr-only">{categories.join('، ')}</div>
  </section>;
}
