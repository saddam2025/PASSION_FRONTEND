import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Send,
  Upload,
  MoreVertical,
  ExternalLink,
  Archive,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type { Course, Snapshot } from '@/schemas/course';
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
import { CoursePagePreview } from '@/features/courses/CoursePagePreview';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { Modal } from '@/components/ui/Overlay';
import { Textarea } from '@/components/ui/fields';
import { CourseShareLinks } from '@/features/courses/CourseShareLinks';
import { mockAuthService } from '@/services/auth.mock';

export type CourseTab = 'page' | 'details' | 'form' | 'seo' | 'history';

interface CourseStudioShellProps {
  course: Course;
  activeTab: CourseTab;
  sectionId?: string;
  assistant?: boolean;
}

export function CourseStudioShell({
  course: initialCourse,
  activeTab,
  sectionId,
  assistant = false,
}: CourseStudioShellProps) {
  const { t, i18n } = useTranslation('courses');
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const client = useQueryClient();

  const [course, setCourse] = useState<Course>(initialCourse);
  const [draft, setDraft] = useState<Snapshot>(initialCourse.draft);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date(initialCourse.updatedAt));
  const [menuOpen, setMenuOpen] = useState(false);
  const [attentionOpen, setAttentionOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'publish' | 'unpublish' | null>(null);
  const [deletionRequestOpen, setDeletionRequestOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    void mockAuthService.getCurrentUser().then((user) => setCurrentUserId(user?.id ?? ''));
  }, []);

  // Sync state if initialCourse changes from parent
  useEffect(() => {
    setCourse(initialCourse);
    setDraft(initialCourse.draft);
    setIsDirty(false);
    setLastSaved(new Date(initialCourse.updatedAt));
  }, [initialCourse]);

  // تغييرات مش محفوظة browser guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const rolePrefix = assistant ? 'assistant' : 'admin';
  const isRtl = i18n.language === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const unpublishedChanges = hasUnpublishedChanges(course);
  const readiness = checkReadiness(draft, course.slug);
  const assistantPending = assistant && course.review.state === 'pending';

  const handleSnapshotChange = (next: Snapshot) => {
    setDraft(next);
    setIsDirty(true);
  };

  const openPreview = () => {
    const key = crypto.randomUUID();
    sessionStorage.setItem(`course-preview:${key}`, JSON.stringify(draft));
    window.open(`/${rolePrefix}/courses/${course.id}/preview?workingCopy=${key}`, '_blank');
  };

  // احفظ كمسودة action
  const handleSaveDraft = async (silent = false): Promise<boolean> => {
    if (assistantPending) return false;
    setIsSaving(true);
    try {
      const res = await coursesService.saveDraft(course.id, draft, course.version);
      if (!res.ok) throw new Error(res.message);
      setCourse(res.data);
      setIsDirty(false);
      setLastSaved(new Date());
      await client.invalidateQueries({ queryKey: ['courses-list'] });
      if (!silent) toast.notify({ title: t('draftSaved', 'تم الحفظ'), tone: 'success' });
      return true;
    } catch {
      if (!silent) toast.notify({ title: t('saveDraftFailed', 'حصلت مشكلة أثناء حفظ المسودة. جرّب تاني.'), tone: 'danger' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSection = async (): Promise<boolean> => {
    const saved = await handleSaveDraft(true);
    toast.notify({ title: saved ? 'تم حفظ القسم' : t('saveDraftFailed', 'حصلت مشكلة أثناء حفظ المسودة. جرّب تاني.'), tone: saved ? 'success' : 'danger' });
    return saved;
  };

  // انشر / انشر التعديلات (Admin only)
  const handlePublish = async () => {
    if (assistant) return;
    if (isDirty) {
      if (!(await handleSaveDraft())) return;
    }
    if (readiness.errors.length) {
      setAttentionOpen(true);
      return;
    }
    try {
      const res = await coursesService.publish(course.id);
      if (!res.ok) {
        if (res.code === 'READINESS_FAILED') {
          setAttentionOpen(true);
          return;
        }
        throw new Error(res.message);
      }
      setCourse(res.data);
      setIsDirty(false);
      await client.invalidateQueries({ queryKey: ['courses-list'] });
      toast.notify({
        title: t('publishSuccess', 'تم نشر الكورس'),
        tone: 'success',
      });
    } catch {
      toast.notify({ title: t('unknownError', 'حصلت مشكلة، جرّب تاني.'), tone: 'danger' });
    }
  };

  // ابعت للمراجعة (Assistant only)
  const handleSubmitReview = async () => {
    if (!assistant) return;
    if (isDirty) {
      if (!(await handleSaveDraft())) return;
    }
    if (readiness.errors.length) {
      setAttentionOpen(true);
      return;
    }
    try {
      const res = await coursesService.submit(course.id);
      if (!res.ok) {
        if (res.code === 'READINESS_FAILED') {
          setAttentionOpen(true);
          return;
        }
        throw new Error(res.message);
      }
      setCourse(res.data);
      setIsDirty(false);
      await client.invalidateQueries({ queryKey: ['courses-list'] });
      toast.notify({
        title: t('submittedForReview', 'اتبعت للمراجعة'),
        tone: 'success',
      });
    } catch {
      toast.notify({ title: t('unknownError', 'حصلت مشكلة، جرّب تاني.'), tone: 'danger' });
    }
  };

  const handleWithdraw = async () => {
    const result = await coursesService.withdraw(course.id, course.version);
    if (!result.ok) {
      toast.notify({ title: result.message, tone: 'danger' });
      return;
    }
    setCourse(result.data);
    await client.invalidateQueries({ queryKey: ['courses-list'] });
    toast.notify({ title: 'تم سحب طلب المراجعة، تقدر تعدّل الكورس دلوقتي.', tone: 'success' });
  };

  const handleRequestDeletion = async () => {
    const result = await coursesService.requestDeletion(course.id, deletionReason);
    if (!result.ok) {
      toast.notify({ title: result.message, tone: 'danger' });
      return;
    }
    setCourse(result.data);
    setDeletionReason('');
    setDeletionRequestOpen(false);
    await Promise.all([
      client.invalidateQueries({ queryKey: ['courses-list'] }),
      client.invalidateQueries({ queryKey: ['review-queue-v2'] }),
      client.invalidateQueries({ queryKey: ['notifications'] }),
      client.invalidateQueries({ queryKey: ['unread-notifications'] }),
    ]);
    toast.notify({ title: 'وصل طلب الحذف للإدارة.', tone: 'success' });
  };

  const handleCancelDeletionRequest = async () => {
    const result = await coursesService.cancelDeletionRequest(course.id);
    if (!result.ok) {
      toast.notify({ title: result.message, tone: 'danger' });
      return;
    }
    setCourse(result.data);
    await Promise.all([
      client.invalidateQueries({ queryKey: ['courses-list'] }),
      client.invalidateQueries({ queryKey: ['review-queue-v2'] }),
    ]);
    toast.notify({ title: 'تم إلغاء طلب الحذف.', tone: 'success' });
  };

  // إلغاء النشر
  const handleUnpublish = async () => {
    try {
      const res = await coursesService.unpublish(course.id);
      if (!res.ok) throw new Error(res.message);
      setCourse(res.data);
      await client.invalidateQueries({ queryKey: ['courses-list'] });
      toast.notify({ title: t('unpublished', 'تم إلغاء نشر الكورس.'), tone: 'success' });
      setMenuOpen(false);
    } catch {
      toast.notify({ title: t('unknownError', 'حصلت مشكلة، جرّب تاني.'), tone: 'danger' });
    }
  };

  // أرشف
  const handleArchive = async () => {
    try {
      const res = await coursesService.archive(course.id);
      if (!res.ok) throw new Error(res.message);
      setCourse(res.data);
      await client.invalidateQueries({ queryKey: ['courses-list'] });
      toast.notify({ title: t('archiveSuccess'), tone: 'success' });
      setMenuOpen(false);
    } catch {
      toast.notify({ title: t('unknownError', 'حصلت مشكلة، جرّب تاني.'), tone: 'danger' });
    }
  };

  const tabs: Array<{ id: CourseTab; label: string }> = [
    { id: 'page', label: t('studioPage', 'الصفحة') },
    { id: 'details', label: t('studioDetails', 'التفاصيل') },
    { id: 'form', label: t('studioForm', 'نموذج التسجيل') },
    { id: 'seo', label: t('studioSeo', 'تحسين محركات البحث') },
    { id: 'history', label: t('studioHistory', 'السجل') },
  ];

  const handleTabClick = (tabId: CourseTab) => {
    if (isDirty) {
      const proceed = window.confirm(t('unsavedChangesWarning', 'عندك تغييرات مش محفوظة، تكمل؟'));
      if (!proceed) return;
    }
    navigate(`/${rolePrefix}/courses/${course.id}/studio/${tabId}`);
  };

  const goToReadinessIssue = (issue: (typeof readiness.errors)[number]) => {
    setAttentionOpen(false);
    sessionStorage.setItem('readiness-focus-path', issue.path);
    const target = issue.sectionId
      ? `/${rolePrefix}/courses/${course.id}/studio/page/${issue.sectionId}`
      : `/${rolePrefix}/courses/${course.id}/studio/${issue.tab}`;
    navigate(target);
    window.setTimeout(() => {
      const node = document.querySelector<HTMLElement>(`[data-readiness-path="${issue.path}"]`)
        ?? (issue.sectionId ? document.querySelector<HTMLElement>(`[data-readiness-section="${issue.sectionId}"]`) : null)
        ?? document.querySelector<HTMLElement>('main input, main textarea, main select');
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = node?.matches('input,textarea,select,button') ? node : node?.querySelector<HTMLElement>('input,textarea,select,button');
      focusable?.focus();
      node?.classList.add('outline', 'outline-2', 'outline-warning');
      window.setTimeout(() => node?.classList.remove('outline', 'outline-2', 'outline-warning'), 2000);
    }, 300);
  };

  const courseTitle = getBilingualText(draft.details.title, language);
  useEffect(() => {
    document.title = 'لوحة التحكم - الكورسات';
  }, []);

  return (
    <div className="relative -mx-4 -mt-6 grid min-h-dvh content-start bg-canvas pb-20 sm:-mx-6 md:-mx-8">
      {/* Sticky استوديو الكورس Top Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-8">
          {/* Back & الكورس info */}
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to={`/${rolePrefix}/courses`}
              className="grid size-9 shrink-0 place-items-center rounded-xs border border-border text-muted hover:bg-canvas hover:text-ink focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={t('backToCourses', 'العودة للكورسات')}
            >
              <BackArrow size={18} />
            </Link>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-bold text-ink sm:text-lg">
                  {courseTitle || course.slug}
                </h1>
                <span className="rounded-xs bg-canvas px-1.5 py-0.5 text-xs font-medium text-muted">
                  {draft.details.category}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {/* الحالة Badges */}
                {course.status === 'published' && (
                  <span className="rounded-xs bg-emerald-50 px-1.5 py-0.2 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    {t('statuses.published')}
                  </span>
                )}
                {unpublishedChanges && (
                  <span className="rounded-xs bg-sky-50 px-1.5 py-0.2 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-600/20">
                    {t('statuses.unpublished_changes', 'تعديلات مش منشورة')}
                  </span>
                )}
                {course.status === 'draft' && course.review.state === 'pending' && (
                  <span className="rounded-xs bg-amber-50 px-1.5 py-0.2 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                    {t('statuses.pending_review')}
                  </span>
                )}
                {course.status === 'draft' && course.review.state === 'rejected' && (
                  <span className="rounded-xs bg-rose-50 px-1.5 py-0.2 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                    {t('statuses.rejected')}
                  </span>
                )}
                {course.status === 'draft' && course.review.state === 'none' && (
                  <span className="rounded-xs bg-slate-100 px-1.5 py-0.2 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-600/20">
                    {t('statuses.draft')}
                  </span>
                )}
                {course.status === 'archived' && (
                  <span className="rounded-xs bg-purple-50 px-1.5 py-0.2 text-[11px] font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
                    {t('statuses.archived')}
                  </span>
                )}

                {/* احفظ status indicator */}
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  {isDirty ? (
                    <>
                      <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>{t('unsavedChanges', 'تغييرات مش محفوظة')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={12} className="text-emerald-600" />
                      <span>
                        {t('allSaved', 'تم الحفظ')} (
                        {formatDate(lastSaved, { hour: '2-digit', minute: '2-digit' })}
                        )
                      </span>
                    </>
                  )}
                </span>
                <button type="button" onClick={() => setAttentionOpen(true)} className="rounded-full border border-danger/30 bg-danger/5 px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/10">
                  جاهزية الكورس · {readiness.errors.length ? `${readiness.errors.length} مشاكل` : 'جاهز'}
                </button>
              </div>
              <div className="mt-2 max-w-2xl"><CourseShareLinks published={course.status === 'published' && Boolean(course.published)} slug={course.slug} title={course.published?.details.title.ar ?? courseTitle} whatsappNumber={course.published?.details.whatsappOverrides?.number} /></div>
            </div>
          </div>

          {/* Desktop Top الإجراءات */}
          <div className="hidden items-center gap-2.5 sm:flex">
            {/* احفظ Draft */}
            {!assistantPending && <Button
              variant="outline"
              size="sm"
              loading={isSaving}
              disabled={isSaving}
              onClick={() => void handleSaveDraft()}
              className="gap-1.5"
            >
              <Save size={15} />
              <span>{isSaving ? t('savingDraft', 'جاري الحفظ…') : t('saveDraft', 'احفظ كمسودة')}</span>
            </Button>}

            {/* معاينة */}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={openPreview}>
                <Eye size={15} />
                <span>{t('preview', 'معاينة')}</span>
            </Button>

            {/* Admin: انشر / انشر Changes */}
            {!assistant && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setConfirmAction('publish')}
                className="gap-1.5"
              >
                <Upload size={15} />
                <span>
                  {course.status === 'published'
                    ? t('publishChanges', 'انشر التعديلات')
                    : t('publish', 'انشر')}
                </span>
              </Button>
            )}

            {/* Assistant: ابعت للمراجعة */}
            {assistant && !assistantPending && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleSubmitReview()}
                disabled={assistantPending}
                className="gap-1.5"
              >
                <Send size={15} />
                <span>{t('submitForReview', 'ابعت للمراجعة')}</span>
              </Button>
            )}

            {assistant && !course.deletionRequest && (
              <Button variant="outline" size="sm" onClick={() => setDeletionRequestOpen(true)}>
                طلب حذف الكورس
              </Button>
            )}
            {assistant && course.deletionRequest?.requestedBy === currentUserId && (
              <Button variant="outline" size="sm" onClick={() => void handleCancelDeletionRequest()}>
                إلغاء طلب الحذف
              </Button>
            )}

            {/* Admin Overflow menu */}
            {!assistant && (
              <div className="relative">
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label={t('moreActions', 'إجراءات أكتر')}
                  onClick={() => setMenuOpen((o) => !o)}
                  className="size-9 text-muted hover:text-ink"
                >
                  <MoreVertical size={16} />
                </IconButton>

                {menuOpen && (
                  <div
                    className="absolute end-0 top-full z-50 mt-1 min-w-44 rounded-md border border-border bg-surface p-1 shadow-elevated"
                    onBlur={() => setMenuOpen(false)}
                  >
                    {course.status === 'published' && (
                      <>
                        <a
                          href={`/${language}/courses/${course.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex w-full items-center gap-2 rounded-xs px-3 py-2 text-xs font-semibold text-ink hover:bg-canvas"
                        >
                          <ExternalLink size={14} />
                          <span>{t('viewLive', 'شوف صفحة الكورس')}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setConfirmAction('unpublish')}
                          className="flex w-full items-center gap-2 rounded-xs px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50"
                        >
                          <Archive size={14} />
                          <span>{t('unpublish', 'إلغاء النشر')}</span>
                        </button>
                      </>
                    )}

                    {course.status !== 'archived' ? (
                      <button
                        type="button"
                        onClick={() => void handleArchive()}
                        className="flex w-full items-center gap-2 rounded-xs px-3 py-2 text-xs font-semibold text-ink hover:bg-canvas"
                      >
                        <Archive size={14} />
                        <span>{t('archive', 'أرشف')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handlePublish()}
                        className="flex w-full items-center gap-2 rounded-xs px-3 py-2 text-xs font-semibold text-ink hover:bg-canvas"
                      >
                        <RefreshCw size={14} />
                        <span>{t('unarchive', 'إلغاء الأرشفة')}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* استوديو الكورس Navigation Tabs */}
        <nav
          aria-label={t('studioTabs', 'تبويبات استوديو الكورس')}
          className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6 md:px-8"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`border-b-2 px-3 py-2.5 text-xs font-bold transition ${
                  active
                    ? 'border-primary text-primary-strong'
                    : 'border-transparent text-muted hover:border-border hover:text-ink'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">{tab.label}{readiness.errors.filter((issue) => issue.tab === tab.id).length > 0 && <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] text-white">{readiness.errors.filter((issue) => issue.tab === tab.id).length}</span>}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main استوديو الكورس Body Area */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8">
        {assistant && !course.deletionRequest && <Button className="mb-4 w-full sm:hidden" variant="outline" onClick={() => setDeletionRequestOpen(true)}>طلب حذف الكورس</Button>}
        {assistant && course.deletionRequest?.requestedBy === currentUserId && <Button className="mb-4 w-full sm:hidden" variant="outline" onClick={() => void handleCancelDeletionRequest()}>إلغاء طلب الحذف</Button>}
        {course.review.state === 'rejected' && course.review.reason && (
          <div className="mb-6 flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">{t('rejectionReason', 'سبب الرفض')}:</span>{' '}
              {course.review.reason}
            </div>
          </div>
        )}

        {course.deletionRequestRejection && (
          <div role="status" className="mb-6 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <span className="font-bold">اترفض طلب الحذف:</span> {course.deletionRequestRejection.reason}
          </div>
        )}

        {course.deletionRequest && (
          <div role="status" className="mb-6 flex flex-wrap items-start justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
            <div className="grid gap-1">
              <p className="font-semibold">طلب الحذف في انتظار موافقة الأدمن</p>
              <p className="text-sm">سبب الطلب: {course.deletionRequest.reason}</p>
              {course.status === 'published' && <p className="text-sm">الكورس هيفضل ظاهر للزوار لحد ما الإدارة تراجع الطلب.</p>}
            </div>
            {assistant && course.deletionRequest.requestedBy === currentUserId && <Button variant="outline" onClick={() => void handleCancelDeletionRequest()}>إلغاء طلب الحذف</Button>}
          </div>
        )}

        {course.review.state === 'pending' && (
          <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
            <p className="font-semibold">الكورس في انتظار المراجعة</p>
            {assistant && <Button variant="outline" onClick={() => void handleWithdraw()}>اسحب الطلب</Button>}
          </div>
        )}

        {assistantPending ? (
          <div aria-label="معاينة الكورس قيد المراجعة"><CoursePagePreview course={course} snapshot={draft} /></div>
        ) : activeTab === 'page' ? (
          <CourseSectionBuilder course={course} snapshot={draft} onChange={handleSnapshotChange} sectionId={sectionId} basePath={`/${rolePrefix}/courses/${course.id}/studio/page`} onSave={handleSaveSection} onPrimaryAction={() => void (assistant ? handleSubmitReview() : handlePublish())} assistant={assistant} />
        ) : (
          <CourseStudioSecondaryTabs course={course} tabKey={activeTab} snapshot={draft} onChange={handleSnapshotChange} assistant={assistant} />
        )}
        {!assistantPending && <footer className="mt-8 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => void handleSaveDraft()}>{t('saveDraft', 'احفظ كمسودة')}</Button>
          {assistant ? <Button onClick={() => void handleSubmitReview()}>{t('submitForReview', 'ابعت للمراجعة')}</Button> : <Button onClick={() => setConfirmAction('publish')}>{t('publish', 'انشر')}</Button>}
        </footer>}
      </main>
      {attentionOpen && <ReadinessPanel issues={readiness.errors} sections={draft.page.sections} onClose={() => setAttentionOpen(false)} onGo={goToReadinessIssue} />}
      {deletionRequestOpen && <Modal
        open
        onOpenChange={(open) => { if (!open) { setDeletionRequestOpen(false); setDeletionReason(''); } }}
        title="طلب حذف الكورس"
        description="اكتب سبب الطلب. الكورس هيفضل بحالته الحالية لحد ما الإدارة تراجعه."
        footer={<><Button variant="secondary" onClick={() => { setDeletionRequestOpen(false); setDeletionReason(''); }}>إلغاء</Button><Button variant="danger" disabled={deletionReason.trim().length < 10 || deletionReason.trim().length > 1000} onClick={() => void handleRequestDeletion()}>ابعت الطلب</Button></>}
      ><label className="grid gap-2 text-sm font-semibold">سبب طلب الحذف<Textarea rows={5} maxLength={1000} value={deletionReason} onChange={(event) => setDeletionReason(event.target.value)} /></label><p className="text-end text-xs text-muted">{deletionReason.length}/1000</p></Modal>}
      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction === 'publish' ? (course.status === 'published' ? t('publishChanges', 'انشر التعديلات') : t('publish', 'انشر')) : t('unpublish', 'إلغاء النشر')}
        description={confirmAction === 'publish' ? 'هننشر النسخة الحالية وهنخليها متاحة للزوار.' : 'هنخفي الكورس ونقفل التسجيل، مع الاحتفاظ بالنسخ.'}
        confirmLabel={confirmAction === 'publish' ? t(course.status === 'published' ? 'publishChanges' : 'publish', course.status === 'published' ? 'انشر التعديلات' : 'انشر') : t('unpublish', 'إلغاء النشر')}
        cancelLabel={t('cancel', 'إلغاء')}
        onConfirm={() => {
          const action = confirmAction;
          setConfirmAction(null);
          if (action === 'publish') void handlePublish();
          else if (action === 'unpublish') void handleUnpublish();
        }}
      />
    </div>
  );
}
