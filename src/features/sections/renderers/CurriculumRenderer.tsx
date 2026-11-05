import type { CSSProperties } from 'react';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import { Accordion } from '@/components/ui/TabsAccordion';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading, getText } from './SectionContent';
import type { AnyRendererProps } from './types';
export default function CurriculumRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  if (section.type !== 'curriculum') return null;
  const c = section.content;
  const numberedModules = (duplicate = false) => (
    <div className="curriculum-marquee-group" role="list" dir="ltr" aria-hidden={duplicate || undefined}>
      {c.modules.map((module, index) => (
        <article key={`${duplicate ? 'copy-' : ''}${index}`} role="listitem" dir="rtl" className="curriculum-module-card">
          <header className="flex items-center justify-between gap-3 border-b border-cyan-100/15 pb-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-semibold text-cyan-100">
              <span className="grid size-6 place-items-center rounded-full bg-cyan-300 font-bold text-slate-950">{String(index + 1).padStart(2, '0')}</span>
              {t('module')}
            </span>
            {module.duration && <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200"><span className="sr-only">{t('duration')}: </span>{getBilingualText(module.duration, language)}</span>}
          </header>
          <h3 className="text-lg font-bold leading-snug text-white sm:text-xl">{getBilingualText(module.title, language)}</h3>
          {module.summary && <p className="text-sm leading-relaxed text-slate-300">{getBilingualText(module.summary, language)}</p>}
          {module.lessons.length > 0 && (
            <div className="mt-auto grid gap-2 border-t border-white/10 pt-3">
              <span className="text-xs font-semibold text-cyan-100">{t('lessons')}</span>
              <ul className="grid gap-1.5 text-sm leading-relaxed text-slate-200">
                {module.lessons.map((lesson, lessonIndex) => <li key={lessonIndex} className="flex items-start gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-300" aria-hidden="true" /><span>{getBilingualText(lesson.title, language)}</span></li>)}
              </ul>
            </div>
          )}
        </article>
      ))}
    </div>
  );
  const curriculumMarquee = (
    <div className="curriculum-marquee" dir="rtl" role="region" tabIndex={0} aria-label={getBilingualText(c.title, language) || t('curriculum')}>
      <div className="curriculum-marquee-track" style={{ '--curriculum-duration': `${Math.max(24, c.modules.length * 5)}s` } as CSSProperties & { '--curriculum-duration': string }}>
        {numberedModules()}
        {numberedModules(true)}
      </div>
    </div>
  );
  const items = c.modules.map((module, index) => ({
    value: `module-${index}`,
    title: getBilingualText(module.title, language),
    content: (
      <div className="grid gap-3">
        {module.summary && <p>{getText(module.summary, language)}</p>}
        {module.duration && (
          <p className="text-sm text-muted">
            {t('duration')}: {getText(module.duration, language)}
          </p>
        )}
        {module.lessons.length > 0 && (
          <ul className="list-inside list-disc">
            {module.lessons.map((lesson, lessonIndex) => (
              <li key={lessonIndex}>{getBilingualText(lesson.title, language)}</li>
            ))}
          </ul>
        )}
      </div>
    ),
  }));
  return (
    <SectionFrame settings={section.settings} id={section.id}>
      <SectionHeading title={c.title} language={language} />
      {c.layout === 'accordion' ? (
        <Accordion items={items} />
      ) : c.layout === 'timeline' ? (
        <ol className="grid gap-4 border-s-2 border-primary ps-6">
          {c.modules.map((module, index) => (
            <li key={index} className="grid gap-2">
              <h3 className="font-bold">{getBilingualText(module.title, language)}</h3>
              {module.summary && <p className="text-muted">{getText(module.summary, language)}</p>}
              {module.lessons.length > 0 && (
                <ul className="list-inside list-disc">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <li key={lessonIndex}>{getBilingualText(lesson.title, language)}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      ) : c.layout === 'numberedCards' ? curriculumMarquee : <div className="section-columns-3">{c.modules.map((module, index) => <article key={index} className="relative grid content-start gap-3 rounded-sm border border-border bg-surface p-5"><span className="grid size-9 place-items-center rounded-full bg-primary/10 font-bold text-primary-strong">{String(index + 1).padStart(2, '0')}</span><h3 className="font-bold">{getBilingualText(module.title, language)}</h3>{module.summary && <p className="text-sm text-muted">{getBilingualText(module.summary, language)}</p>}{module.duration && <p className="text-xs text-muted">{t('duration')}: {getBilingualText(module.duration, language)}</p>}{module.lessons.length > 0 && <ul className="list-inside list-disc">{module.lessons.map((lesson, lessonIndex) => <li key={lessonIndex}>{getBilingualText(lesson.title, language)}</li>)}</ul>}</article>)}</div>}
    </SectionFrame>
  );
}
