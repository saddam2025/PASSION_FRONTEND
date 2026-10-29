import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageRenderer } from '@/features/sections/PageRenderer';
import type { PageConfig } from '@/schemas/sections';
import type { CoursePageContextValue } from '@/features/sections/CoursePageContext';
import { useLanguage } from '@/i18n/useLanguage';
type Context = Omit<CoursePageContextValue, 'mode'>;
export function ReviewPreviewPanel({
  live,
  proposed,
  liveContext,
  proposedContext,
}: {
  live?: PageConfig;
  proposed: PageConfig;
  liveContext?: Context;
  proposedContext: Context;
}) {
  const { t } = useTranslation('review');
  const [mode, setMode] = useState<'live' | 'proposed' | 'side'>('proposed');
  const [width, setWidth] = useState(1200);
  const { language, setLanguage } = useLanguage();
  return (
    <section className="grid gap-4 rounded-md border border-border bg-surface p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">{t('preview')}</h2>
          <p className="mt-1 text-sm text-muted">{t('previewNotice')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-sm border border-border px-3 text-sm"
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          >
            {language === 'ar' ? t('switchEnglish') : t('switchArabic')}
          </button>
          <select
            aria-label={t('preview')}
            className="min-h-11 rounded-sm border border-border px-3"
            value={mode}
            onChange={(event) => setMode(event.target.value as typeof mode)}
          >
            <option value="live">{t('live')}</option>
            <option value="proposed">{t('proposed')}</option>
            <option value="side">{t('sideBySide')}</option>
          </select>
          <select
            aria-label={t('deviceWidth')}
            className="min-h-11 rounded-sm border border-border px-3"
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          >
            <option value={375}>375px</option>
            <option value={768}>768px</option>
            <option value={1200}>1200px</option>
          </select>
        </div>
      </header>
      <div className={`grid gap-4 ${mode === 'side' ? 'xl:grid-cols-2' : ''}`}>
        {mode !== 'proposed' && live && liveContext && (
          <div className="min-w-0 overflow-auto rounded-sm border border-border p-2">
            <p className="p-2 text-xs font-bold">{t('live')}</p>
            <div className="mx-auto" style={{ maxWidth: width }}>
              <PageRenderer config={live} context={liveContext} mode="preview" />
            </div>
          </div>
        )}
        {mode !== 'live' && (
          <div className="min-w-0 overflow-auto rounded-sm border border-border p-2">
            <p className="p-2 text-xs font-bold">
              {t('proposed')} · {t('notPublished')}
            </p>
            <div className="mx-auto" style={{ maxWidth: width }}>
              <PageRenderer config={proposed} context={proposedContext} mode="preview" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
