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
      ) : <div className="section-columns-3">{c.modules.map((module, index) => <article key={index} className="relative grid content-start gap-3 rounded-sm border border-border bg-surface p-5"><span className="grid size-9 place-items-center rounded-full bg-primary/10 font-bold text-primary-strong">{String(index + 1).padStart(2, '0')}</span><h3 className="font-bold">{getBilingualText(module.title, language)}</h3>{module.summary && <p className="text-sm text-muted">{getBilingualText(module.summary, language)}</p>}{module.duration && <p className="text-xs text-muted">{t('duration')}: {getBilingualText(module.duration, language)}</p>}{module.lessons.length > 0 && <ul className="list-inside list-disc">{module.lessons.map((lesson, lessonIndex) => <li key={lessonIndex}>{getBilingualText(lesson.title, language)}</li>)}</ul>}</article>)}</div>}
    </SectionFrame>
  );
}
