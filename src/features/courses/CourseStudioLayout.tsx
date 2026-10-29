import type { PropsWithChildren } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLanguage } from '@/i18n/useLanguage';
import type { CourseRecord } from '@/schemas/course';
import { coursesAdminService } from '@/services/courses.admin';
import { useToast } from '@/components/ui/feedback';

export function CourseStudioLayout({ course, assistant, pending, children }: PropsWithChildren<{
  course: CourseRecord;
  assistant: boolean;
  pending: boolean;
}>) {
  const { t } = useTranslation('courses');
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const toast = useToast();
  const [tip, setTip] = useState(Boolean((location.state as { showStudioTip?: boolean } | null)?.showStudioTip));
  const base = `/${assistant ? 'assistant' : 'admin'}/courses/${course.id}`;
  const tabs = [
    { label: t('studioPage'), to: `${base}/studio` },
    { label: t('details'), to: `${base}/edit#basics` },
    { label: t('registrationForm'), to: `${base}/edit#registrationForm` },
    { label: t('sections.seo'), to: `${base}/edit#seo` },
  ];
  return (
    <div className="grid gap-5 pb-20">
      <header className="sticky top-0 z-30 -mx-4 grid gap-3 border-b border-border bg-surface/95 px-4 py-3 shadow-soft backdrop-blur md:-mx-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/${assistant ? 'assistant' : 'admin'}/courses`} className="text-xs underline">{t('backToCourses')}</Link>
            <h1 className="truncate text-lg font-bold">{course.details.title[language] || course.details.slug}</h1>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-pill bg-canvas px-2 py-1">{course.status === 'published' ? t('publishedVersion', { version: course.publishedVersion }) : t(`statuses.${course.status}`)}</span>
              {pending && <span className="rounded-pill bg-warning/10 px-2 py-1 text-warning">{t('revisionPending')}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`${base}/preview`} className="inline-flex min-h-10 items-center rounded-sm border border-border px-3 text-sm">{t('previewPage')}</Link>
            {course.status === 'published' && <a href={`/${language}/courses/${course.details.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-sm border border-border px-3 text-sm">{t('viewLive')}</a>}
            <Link to={`${base}/history`} className="inline-flex min-h-10 items-center rounded-sm border border-border px-3 text-sm">{t('history')}</Link>
            {!assistant && <details className="relative"><summary className="flex min-h-10 cursor-pointer list-none items-center rounded-sm border border-border px-3 text-sm">{t('moreActions')}</summary><div className="absolute end-0 z-40 mt-1 grid min-w-52 gap-1 rounded-sm border border-border bg-surface p-2 shadow-elevated">{course.status === 'published' && <button className="min-h-10 px-3 text-start text-sm hover:bg-canvas" onClick={() => { if (window.confirm(t('unpublishConfirm'))) void coursesAdminService.unpublish(course.id).then(() => Promise.all([client.invalidateQueries({ queryKey: ['course', course.id] }), client.invalidateQueries({ queryKey: ['admin-courses'] })])).then(() => toast.notify({ title: t('unpublished'), tone: 'success' })).catch(() => toast.notify({ title: t('publishError'), tone: 'danger' })); }}>{t('unpublish')}</button>}{course.status === 'archived' ? <button className="min-h-10 px-3 text-start text-sm hover:bg-canvas" onClick={() => void coursesAdminService.unarchive(course.id).then(() => client.invalidateQueries({ queryKey: ['course', course.id] }))}>{t('unarchive')}</button> : <button className="min-h-10 px-3 text-start text-sm hover:bg-canvas" onClick={() => void coursesAdminService.archive(course.id).then(() => navigate('/admin/courses')).catch(() => toast.notify({ title: t('unknownError'), tone: 'danger' }))}>{t('archive')}</button>}</div></details>}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto" aria-label={t('studioTabs')}>
          {tabs.map((tab) => <Link key={tab.label} to={tab.to} className="min-h-10 shrink-0 rounded-xs px-3 py-2 text-sm hover:bg-canvas">{tab.label}</Link>)}
        </nav>
      </header>
      {tip && <aside className="flex items-start justify-between gap-3 rounded-sm border border-info/30 bg-info/5 p-3 text-sm"><p>{t('studioTip')}</p><button type="button" aria-label={t('dismissTip')} onClick={() => setTip(false)} className="min-h-8 px-2">×</button></aside>}
      {children}
    </div>
  );
}
