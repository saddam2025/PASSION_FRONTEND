import { useState, type CSSProperties } from 'react';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import { SectionFrame } from '../SectionFrame';
import { SectionHeading } from './SectionContent';
import type { AnyRendererProps } from './types';

export default function CurriculumRenderer({ section }: AnyRendererProps) {
  const { language } = useLanguage();
  const { t } = useTranslation('sections');
  const [active, setActive] = useState(0);
  if (section.type !== 'curriculum') return null;
  const { content } = section;
  const module = content.modules[active];

  return (
    <SectionFrame settings={section.settings} id={section.id}>
      <SectionHeading title={content.title} language={language} />
      {content.modules.length === 0 ? null : (
        <section className="curriculum-tabs-card" aria-label={getBilingualText(content.title, language) || t('curriculum')}>
          <div className="curriculum-tabs-list" role="tablist" aria-orientation="vertical">
            {content.modules.map((item, index) => (
              <button
                key={`module-${index}`}
                id={`curriculum-tab-${section.id}-${index}`}
                type="button"
                role="tab"
                aria-selected={active === index}
                aria-controls={`curriculum-panel-${section.id}`}
                tabIndex={active === index ? 0 : -1}
                className="curriculum-tab"
                onClick={() => setActive(index)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
                    event.preventDefault();
                    setActive((value) => (value + 1) % content.modules.length);
                  } else if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
                    event.preventDefault();
                    setActive((value) => (value - 1 + content.modules.length) % content.modules.length);
                  }
                }}
              >
                <span className="curriculum-tab-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span>{getBilingualText(item.title, language)}</span>
              </button>
            ))}
          </div>
          {module && (
            <div id={`curriculum-panel-${section.id}`} className="curriculum-tab-content" role="tabpanel" aria-labelledby={`curriculum-tab-${section.id}-${active}`}>
              <div className="curriculum-progress" style={{ '--progress-count': content.modules.length } as CSSProperties} aria-hidden="true">
                {content.modules.map((_, index) => <span key={index} data-active={index <= active ? 'true' : 'false'} />)}
              </div>
              <header>
                <p className="landing-price-badge">{t('module')} {String(active + 1).padStart(2, '0')}</p>
                <h3 className="mt-4 text-2xl font-bold text-white">{getBilingualText(module.title, language)}</h3>
                {module.summary && <p className="mt-3 text-slate-300">{getBilingualText(module.summary, language)}</p>}
                {module.duration && <p className="mt-3 text-sm text-slate-400">{t('duration')}: {getBilingualText(module.duration, language)}</p>}
              </header>
              {module.lessons.length > 0 && (
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-cyan-200">{t('lessons')}</h4>
                  <ul className="curriculum-spec-list">
                    {module.lessons.map((lesson, index) => <li key={index}>{getBilingualText(lesson.title, language)}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </SectionFrame>
  );
}
