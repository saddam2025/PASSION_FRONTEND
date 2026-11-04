import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle, ExternalLink, Eye, MoreVertical, Save, Upload } from 'lucide-react';
import type { Course, CourseStatus, Snapshot } from '@/schemas/course';
import { coursesService } from '@/services/courses';
import { hasUnpublishedChanges } from '@/services/courses/hash';
import { Button, IconButton } from '@/components/ui/Button';
import { useToast } from '@/components/ui/feedback';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { CourseSectionBuilder } from './tabs/CourseSectionBuilder';
import { CourseStudioSecondaryTabs } from './tabs/CourseStudioSecondaryTabs';
import { formatDate } from '@/lib/formatters';
import { checkReadiness } from '@/schemas/courseReadiness';
import { ReadinessPanel } from './ReadinessPanel';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { CourseShareLinks } from '@/features/courses/CourseShareLinks';

export type CourseTab = 'page' | 'details' | 'form' | 'seo';
type ConfirmAction = 'publish' | 'unpublish' | 'archive' | 'unarchive';
export function CourseStudioShell({ course: initialCourse, activeTab, sectionId }: { course: Course; activeTab: CourseTab; sectionId?: string }) {
  const { t } = useTranslation('courses');
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const client = useQueryClient();
  const [course, setCourse] = useState(initialCourse);
  const [draft, setDraft] = useState<Snapshot>(initialCourse.draft);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date(initialCourse.updatedAt));
  const [menuOpen, setMenuOpen] = useState(false);
  const [attentionOpen, setAttentionOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const readiness = checkReadiness(draft, course.slug);
  const title = getBilingualText(draft.details.title, language);
  const changedAfterPublish = hasUnpublishedChanges(course);
  useEffect(() => { setCourse(initialCourse); setDraft(initialCourse.draft); setDirty(false); setLastSaved(new Date(initialCourse.updatedAt)); }, [initialCourse]);
  useEffect(() => { document.title = 'لوحة التحكم - الكورسات'; }, []);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  const updateDraft = (next: Snapshot) => { setDraft(next); setDirty(true); };
  const saveDraft = async (silent = false) => {
    setSaving(true);
    try {
      const result = await coursesService.saveDraft(course.id, draft, course.version);
      if (!result.ok) throw new Error(result.message);
      setCourse(result.data); setDirty(false); setLastSaved(new Date());
      await client.invalidateQueries({ queryKey: ['courses-list'] });
      if (!silent) toast.notify({ title: t('draftSaved', 'تم الحفظ'), tone: 'success' });
      return true;
    } catch (error) {
      if (!silent) toast.notify({ title: error instanceof Error ? error.message : 'حصلت مشكلة، جرّب تاني.', tone: 'danger' });
      return false;
    } finally { setSaving(false); }
  };
  const saveSection = async () => { const saved = await saveDraft(true); toast.notify({ title: saved ? 'تم حفظ القسم' : 'حصلت مشكلة، جرّب تاني.', tone: saved ? 'success' : 'danger' }); return saved; };
  const runAction = async (action: ConfirmAction) => {
    let publishTarget = course;
    if (action === 'publish') {
      if (readiness.errors.length) {
        setAttentionOpen(true);
        return;
      }
      if (dirty) {
        const saved = await coursesService.saveDraft(course.id, draft, course.version);
        if (!saved.ok) {
          toast.notify({ title: saved.message, tone: 'danger' });
          return;
        }
        publishTarget = saved.data;
        setCourse(saved.data);
        setDirty(false);
        setLastSaved(new Date(saved.data.updatedAt));
      }
    }
    const result = action === 'publish' ? await coursesService.publish(publishTarget.id, publishTarget.version)
      : action === 'unpublish' ? await coursesService.unpublish(course.id, course.version)
        : action === 'archive' ? await coursesService.archive(course.id, course.version)
          : await coursesService.unarchive(course.id, course.version);
    if (!result.ok) { if (result.code === 'READINESS_FAILED') setAttentionOpen(true); else toast.notify({ title: result.message, tone: 'danger' }); return; }
    setCourse(result.data); setDirty(false); await client.invalidateQueries({ queryKey: ['courses-list'] });
    toast.notify({ title: action === 'publish' ? 'تم نشر الكورس' : action === 'unpublish' ? 'تم إلغاء نشر الكورس' : action === 'archive' ? 'تم أرشفة الكورس' : 'تم إلغاء أرشفة الكورس', tone: 'success' });
  };
  const openPreview = () => {
    const key = crypto.randomUUID(); sessionStorage.setItem(`course-preview:${key}`, JSON.stringify(draft));
    window.open(`/admin/courses/${course.id}/preview?workingCopy=${key}`, '_blank');
  };
  const tabs: Array<{ id: CourseTab; label: string }> = [
    { id: 'page', label: t('studioPage', 'الصفحة') }, { id: 'details', label: t('studioDetails', 'التفاصيل') },
    { id: 'form', label: t('studioForm', 'نموذج التسجيل') }, { id: 'seo', label: t('studioSeo', 'تحسين محركات البحث') },
  ];
  const tabClick = (tab: CourseTab) => {
    if (dirty && !window.confirm(t('unsavedChangesWarning', 'عندك تغييرات مش محفوظة، تكمل؟'))) return;
    navigate(`/admin/courses/${course.id}/studio/${tab}`);
  };
  const goToIssue = (issue: (typeof readiness.errors)[number]) => {
    setAttentionOpen(false); sessionStorage.setItem('readiness-focus-path', issue.path);
    const target = issue.sectionId ? `/admin/courses/${course.id}/studio/page/${issue.sectionId}` : `/admin/courses/${course.id}/studio/${issue.tab}`;
    navigate(target);
    window.setTimeout(() => {
      const node = document.querySelector<HTMLElement>(`[data-readiness-path="${issue.path}"]`) ?? (issue.sectionId ? document.querySelector<HTMLElement>(`[data-readiness-section="${issue.sectionId}"]`) : null) ?? document.querySelector<HTMLElement>('main input, main textarea, main select');
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = node?.matches('input,textarea,select,button') ? node : node?.querySelector<HTMLElement>('input,textarea,select,button');
      focusable?.focus(); node?.classList.add('outline','outline-2','outline-warning'); window.setTimeout(() => node?.classList.remove('outline','outline-2','outline-warning'), 2000);
    }, 300);
  };
  const isRtl = language === 'ar'; const BackArrow = isRtl ? ArrowRight : ArrowLeft;
  return <div className="relative -mx-4 -mt-6 grid min-h-dvh min-w-0 w-full max-w-full content-start bg-canvas pb-20 sm:-mx-6 md:-mx-8">
    <header className="border-b border-border bg-surface"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-8">
      <div className="flex min-w-0 items-center gap-3"><Link to="/admin/courses" aria-label="العودة للكورسات" className="grid size-9 shrink-0 place-items-center rounded-xs border border-border text-muted hover:bg-canvas"><BackArrow size={18}/></Link><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-base font-bold text-ink sm:text-lg">{title || course.slug}</h1><span className="rounded-xs bg-canvas px-1.5 py-0.5 text-xs text-muted">{draft.details.category}</span></div><div className="flex flex-wrap items-center gap-2 pt-1">{(['published','draft','archived'] as CourseStatus[]).filter((status) => course.status === status).map((status) => <span key={status} className="rounded-xs bg-canvas px-1.5 py-0.5 text-[11px] font-semibold">{t(`statuses.${status}`)}</span>)}{changedAfterPublish && <span className="rounded-xs bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-700">تعديلات مش منشورة</span>}<span className="inline-flex items-center gap-1.5 text-xs text-muted">{dirty ? <><span className="size-2 animate-pulse rounded-full bg-amber-500"/>تغييرات مش محفوظة</> : <><CheckCircle size={12} className="text-emerald-600"/>تم الحفظ ({formatDate(lastSaved,{hour:'2-digit',minute:'2-digit'})})</>}</span><button type="button" onClick={() => setAttentionOpen(true)} className="rounded-full border border-danger/30 bg-danger/5 px-2.5 py-1 text-xs font-semibold text-danger">جاهزية الكورس · {readiness.errors.length ? `${readiness.errors.length} مشاكل` : 'جاهز'}</button></div><div className="mt-2 max-w-2xl"><CourseShareLinks published={course.status === 'published' && Boolean(course.published)} slug={course.slug} title={course.published?.details.title.ar ?? title} whatsappNumber={course.published?.details.whatsappOverrides?.number}/></div></div></div>
      <div className="flex min-w-0 flex-wrap items-center gap-2"><Button variant="outline" size="sm" loading={saving} onClick={() => void saveDraft()}><Save size={15}/>احفظ كمسودة</Button><Button variant="outline" size="sm" onClick={openPreview}><Eye size={15}/>معاينة</Button><Button size="sm" onClick={() => setConfirmAction('publish')}><Upload size={15}/>{course.status === 'published' ? 'انشر التعديلات' : 'انشر'}</Button><div className="relative"><IconButton variant="ghost" size="sm" aria-label="إجراءات أكتر" onClick={() => setMenuOpen(!menuOpen)}><MoreVertical size={16}/></IconButton>{menuOpen && <div className="absolute end-0 top-full z-50 mt-1 grid min-w-44 rounded-md border border-border bg-surface p-1 shadow-elevated">{course.status === 'published' && <><a href={`/ar/courses/${course.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xs px-3 py-2 text-xs font-semibold hover:bg-canvas"><ExternalLink size={14}/>شوف صفحة الكورس</a><button onClick={() => setConfirmAction('unpublish')} className="rounded-xs px-3 py-2 text-start text-xs hover:bg-canvas">إلغاء النشر</button></>}{course.status === 'archived' ? <button onClick={() => setConfirmAction('unarchive')} className="rounded-xs px-3 py-2 text-start text-xs hover:bg-canvas">إلغاء الأرشفة</button> : <button onClick={() => setConfirmAction('archive')} className="rounded-xs px-3 py-2 text-start text-xs hover:bg-canvas">أرشف</button>}</div>}</div></div>
    </div><nav aria-label="تبويبات استوديو الكورس" className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6 md:px-8">{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => tabClick(tab.id)} className={`border-b-2 px-3 py-2.5 text-xs font-bold ${activeTab === tab.id ? 'border-primary text-primary-strong' : 'border-transparent text-muted'}`}>{tab.label}{readiness.errors.filter((issue) => issue.tab === tab.id).length > 0 && <span className="ms-2 rounded-full bg-danger px-1.5 py-0.5 text-[10px] text-white">{readiness.errors.filter((issue) => issue.tab === tab.id).length}</span>}</button>)}</nav></header>
    <main className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 md:px-8">{activeTab === 'page' ? <CourseSectionBuilder course={course} snapshot={draft} onChange={updateDraft} sectionId={sectionId} basePath={`/admin/courses/${course.id}/studio/page`} onSave={saveSection} onPrimaryAction={() => setConfirmAction('publish')}/> : <CourseStudioSecondaryTabs course={course} tabKey={activeTab} snapshot={draft} onChange={updateDraft}/>}<footer className="mt-8 flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button variant="outline" onClick={() => void saveDraft()}>احفظ كمسودة</Button><Button onClick={() => setConfirmAction('publish')}>{course.status === 'published' ? 'انشر التعديلات' : 'انشر'}</Button></footer></main>
    {attentionOpen && <ReadinessPanel issues={readiness.errors} sections={draft.page.sections} onClose={() => setAttentionOpen(false)} onGo={goToIssue}/>}
    <ConfirmDialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)} title={confirmAction === 'publish' ? (course.status === 'published' ? 'انشر التعديلات؟' : 'انشر الكورس؟') : confirmAction === 'unpublish' ? 'إلغاء نشر الكورس؟' : confirmAction === 'archive' ? 'أرشفة الكورس؟' : 'إلغاء الأرشفة؟'} description={confirmAction === 'publish' ? 'هننشر النسخة الحالية وهنخليها متاحة للزوار.' : 'هتتحدّث حالة الكورس حسب اختيارك.'} confirmLabel="تأكيد" cancelLabel="إلغاء" onConfirm={() => { const action = confirmAction; setConfirmAction(null); if (action) void runAction(action); }}/>
  </div>;
}


