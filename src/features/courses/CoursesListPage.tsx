import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Plus, ExternalLink, Trash2, Archive, RefreshCw, Layers } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Overlay';
import { EmptyState, ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { coursesService } from '@/services/courses';
import { coursesAdminService } from '@/services/courses.admin';
import type { CourseListFilters, CourseListItem, CourseStatusCounts } from '@/services/courses/types';
import type { CourseStatus } from '@/schemas/course';
import { useNewCourseDialog } from './newCourseDialogStore';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { formatDate as formatLocaleDate } from '@/lib/formatters';
import type { Course } from '@/schemas/course';
import { checkReadiness } from '@/schemas/courseReadiness';
import { ReadinessPanel } from './studio/ReadinessPanel';
import { CourseShareLinks } from './CourseShareLinks';

type FilterStatus = CourseStatus | 'all' | 'unpublished_changes' | 'pending_review' | 'rejected';

export default function CoursesListPage({ assistant = false }: { assistant?: boolean }) {
  const { t } = useTranslation('courses');
  const { language } = useLanguage();
  const [params, setParams] = useSearchParams();
  const newCourse = useNewCourseDialog();
  const client = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const rolePrefix = assistant ? 'assistant' : 'admin';

  const [query, setQuery] = useState(params.get('search') ?? '');
  const [selectedCourse, setSelectedCourse] = useState<CourseListItem | null>(null);
  const [typedSlug, setTypedSlug] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishTarget, setPublishTarget] = useState<{ course: CourseListItem; action: 'publish' | 'unpublish' } | null>(null);
  const [readinessCourse, setReadinessCourse] = useState<Course | null>(null);
  const [readinessIssues, setReadinessIssues] = useState<ReturnType<typeof checkReadiness>['errors']>([]);

  const activeStatus = (params.get('status') as FilterStatus) || 'all';
  const activeCategory = params.get('category') ?? '';
  const activeSort = (params.get('sort') as 'newest' | 'oldest' | 'title') ?? 'newest';
  const page = Math.max(1, Number(params.get('page') ?? 1));

  // Debounced search sync to URL
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (query.trim()) next.set('search', query.trim());
      else next.delete('search');
      next.set('page', '1');
      if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [params, query, setParams]);

  // Open dialog if ?new=1
  useEffect(() => {
    if (params.get('new') === '1') {
      newCourse.open();
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
  }, [newCourse, params, setParams]);

  // Query courses with filters
  const coursesQuery = useQuery({
    queryKey: ['courses-list', activeStatus, params.get('search'), activeCategory, activeSort, page],
    queryFn: async () => {
      const filters: CourseListFilters = {
        search: params.get('search') ?? '',
        category: activeCategory,
        sort: activeSort,
        page,
        pageSize: 10,
      };

      if (activeStatus === 'unpublished_changes') {
        filters.status = 'published';
        filters.hasUnpublishedChanges = true;
      } else if (activeStatus === 'pending_review') {
        filters.reviewState = 'pending';
      } else if (activeStatus === 'rejected') {
        filters.reviewState = 'rejected';
      } else if (activeStatus !== 'all') {
        filters.status = activeStatus;
      }

      const res = await coursesService.list(filters);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['course-categories'],
    queryFn: () => coursesAdminService.categories(),
  });

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setParams(next);
  };

  const handleArchive = async (course: CourseListItem) => {
    try {
      const res = await coursesService.archive(course.id);
      if (!res.ok) throw new Error(res.message);
      await client.invalidateQueries({ queryKey: ['courses-list'] });
      toast.notify({ title: t('archiveSuccess'), tone: 'success' });
    } catch {
      toast.notify({ title: t('unknownError', 'حصلت مشكلة، جرّب تاني.'), tone: 'danger' });
    }
  };

  const handleUnarchive = async (course: CourseListItem) => {
    try {
      const res = await coursesService.unarchive(course.id);
      if (!res.ok) throw new Error(res.message);
      await client.invalidateQueries({ queryKey: ['courses-list'] });
      toast.notify({ title: t('unarchiveSuccess'), tone: 'success' });
    } catch {
      toast.notify({ title: t('unknownError', 'حصلت مشكلة، جرّب تاني.'), tone: 'danger' });
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;
    setIsDeleting(true);
    try {
      const res = await coursesService.remove(selectedCourse.id);
      if (!res.ok) throw new Error(res.message);
      await client.invalidateQueries({ queryKey: ['courses-list'] });
      toast.notify({
        title: res.data.softDeleted ? t('softDeleteSuccess') : t('deleteSuccess'),
        tone: 'success',
      });
      setSelectedCourse(null);
      setTypedSlug('');
    } catch {
      toast.notify({ title: t('unknownError', 'حصلت مشكلة، جرّب تاني.'), tone: 'danger' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeletionRequest = async (id: string) => {
    const result = await coursesService.cancelDeletionRequest(id);
    if (!result.ok) {
      toast.notify({ title: result.message, tone: 'danger' });
      return;
    }
    await Promise.all([
      client.invalidateQueries({ queryKey: ['courses-list'] }),
      client.invalidateQueries({ queryKey: ['review-queue-v2'] }),
    ]);
    toast.notify({ title: 'تم إلغاء طلب الحذف.', tone: 'success' });
  };

  const prepareListTransition = async (item: CourseListItem, action: 'publish' | 'unpublish') => {
    const result = await coursesService.get(item.id);
    if (!result.ok) { toast.notify({ title: result.message, tone: 'danger' }); return; }
    setReadinessCourse(result.data);
    const issues = action === 'publish' ? checkReadiness(result.data.draft, result.data.slug).errors : [];
    if (issues.length) { setReadinessIssues(issues); return; }
    setPublishTarget({ course: item, action });
  };
  const confirmListTransition = async () => {
    if (!publishTarget) return;
    const result = publishTarget.action === 'publish'
      ? await coursesService.publish(publishTarget.course.id)
      : await coursesService.unpublish(publishTarget.course.id);
    if (!result.ok) {
      if (result.code === 'READINESS_FAILED' && result.details) setReadinessIssues(result.details as ReturnType<typeof checkReadiness>['errors']);
      else toast.notify({ title: result.message, tone: 'danger' });
      return;
    }
    await client.invalidateQueries({ queryKey: ['courses-list'] });
    setPublishTarget(null);
    toast.notify({ title: publishTarget.action === 'publish' ? 'تم نشر الكورس.' : 'تم إلغاء نشر الكورس وقفل التسجيل.', tone: 'success' });
  };
  const goToReadinessIssue = (issue: (typeof readinessIssues)[number]) => {
    if (!readinessCourse) return;
    setReadinessIssues([]);
    navigate(issue.sectionId
      ? `/${rolePrefix}/courses/${readinessCourse.id}/studio/page/${issue.sectionId}`
      : `/${rolePrefix}/courses/${readinessCourse.id}/studio/${issue.tab}`);
  };

  const counts: CourseStatusCounts = coursesQuery.data?.counts ?? {
    all: 0,
    published: 0,
    draft: 0,
    pending_review: 0,
    rejected: 0,
    archived: 0,
    unpublished_changes: 0,
  };

  const chips: Array<{ key: FilterStatus; label: string; count: number }> = [
    { key: 'all', label: t('statuses.all'), count: counts.all },
    { key: 'published', label: t('statuses.published'), count: counts.published },
    { key: 'unpublished_changes', label: t('statuses.unpublished_changes', 'تعديلات مش منشورة'), count: counts.unpublished_changes },
    { key: 'pending_review', label: t('statuses.pending_review'), count: counts.pending_review },
    { key: 'draft', label: t('statuses.draft'), count: counts.draft },
    { key: 'rejected', label: t('statuses.rejected'), count: counts.rejected },
    { key: 'archived', label: t('statuses.archived'), count: counts.archived },
  ];

  const formatDate = (isoString: string) => {
    try {
      return formatLocaleDate(isoString);
    } catch {
      return isoString;
    }
  };

  return (
    <section className="grid gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {t(assistant ? 'assistantCourses' : 'manageCourses')}
          </h1>
          <p className="mt-1 text-sm text-muted">{t('courseListIntro')}</p>
        </div>
        <Button onClick={newCourse.open} className="gap-2">
          <Plus aria-hidden="true" size={18} />
          <span>{t('newCourse')}</span>
        </Button>
      </header>

      {/* الحالة Chips with Counts */}
      <div
        role="group"
        aria-label={t('status')}
        className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1"
      >
        {chips.map((chip) => {
          const active = activeStatus === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter('status', chip.key)}
              className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold transition ${
                active
                  ? 'border-primary bg-primary text-white shadow-xs'
                  : 'border-border bg-surface text-ink hover:border-border-strong hover:bg-canvas'
              }`}
            >
              <span>{chip.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-canvas text-muted'
                }`}
              >
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters row: Search, التصنيف, Sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            aria-hidden="true"
            size={16}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            aria-label={t('search')}
            placeholder={t('search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-11 w-full rounded-sm border border-border bg-surface ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          aria-label={t('category')}
          value={activeCategory}
          onChange={(e) => setFilter('category', e.target.value)}
          className="min-h-11 rounded-sm border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">{t('allCategories')}</option>
          {categoriesQuery.data?.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          aria-label={t('sort')}
          value={activeSort}
          onChange={(e) => setFilter('sort', e.target.value)}
          className="min-h-11 rounded-sm border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="newest">{t('sortNewest')}</option>
          <option value="oldest">{t('sortOldest')}</option>
          <option value="title">{t('sortTitle')}</option>
        </select>
      </div>

      {/* Content states */}
      {coursesQuery.isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="card" className="h-24" />
          ))}
        </div>
      ) : coursesQuery.isError ? (
        <ErrorState
          title={t('loadError', 'ما قدرناش نحمّل الكورسات')}
          onRetry={() => void coursesQuery.refetch()}
        />
      ) : !coursesQuery.data?.items.length ? (
        <EmptyState
          title={t('emptyTitle', 'مفيش كورسات')}
          description={t('emptyDescription', 'أنشئ مسودة كورس عشان تبدأ.')}
          action={
            <Button onClick={newCourse.open} className="gap-2">
              <Plus size={16} />
              <span>{t('createFirstCourse')}</span>
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-md border border-border bg-surface shadow-xs md:block">
            <table className="w-full text-start text-sm">
              <thead className="border-b border-border bg-canvas/60 text-xs font-semibold uppercase text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start">
                    {t('title', 'الكورس')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start">
                    {t('status', 'الحالة')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start">
                    {t('category', 'التصنيف')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start">
                    {t('author', 'أنشأها')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start">
                    {t('updatedAt', 'آخر تحديث')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end">
                    {t('actions', 'الإجراءات')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coursesQuery.data.items.map((course) => {
                  const courseTitle = getBilingualText(course.title, language);
                  return (
                    <tr key={course.id} className="transition hover:bg-canvas/40">
                      {/* Cover & Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={course.coverImage.src || '/images/course-cover-default.webp'}
                            alt={getBilingualText(course.coverImage.alt, language) || courseTitle}
                            className="size-11 shrink-0 rounded-xs border border-border object-cover"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/${rolePrefix}/courses/${course.id}/studio/page`}
                              className="block truncate font-bold text-ink hover:text-primary hover:underline"
                            >
                              {courseTitle}
                            </Link>
                            <span className="block truncate font-mono text-xs text-muted">
                              /{course.slug}
                            </span>
                            {course.deletionRequest && <span className="mt-1 block text-xs font-semibold text-amber-800">طلب الحذف في انتظار موافقة الأدمن · {course.deletionRequest.reason}</span>}
                            {course.deletionRequestRejection && <span className="mt-1 block text-xs text-rose-800">تم رفض طلب الحذف: {course.deletionRequestRejection.reason}</span>}
                          </div>
                        </div>
                      </td>

                      {/* الحالة Badges */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {course.status === 'published' && (
                            <span className="inline-flex items-center rounded-xs bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              {t('statuses.published')}
                            </span>
                          )}

                          {course.hasUnpublishedChanges && (
                            <span className="inline-flex items-center rounded-xs bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">
                              {t('statuses.unpublished_changes', 'تعديلات مش منشورة')}
                            </span>
                          )}

                          {course.status === 'draft' && course.reviewState === 'pending' && (
                            <span className="inline-flex items-center rounded-xs bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                              {t('statuses.pending_review')}
                            </span>
                          )}

                          {course.reviewState === 'rejected' && (
                            <span
                              title={course.reviewReason}
                              className="inline-flex items-center rounded-xs bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20"
                            >
                              {t('statuses.rejected')}
                            </span>
                          )}

                          {course.status === 'draft' && course.reviewState === 'none' && (
                            <span className="inline-flex items-center rounded-xs bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">
                              {t('statuses.draft')}
                            </span>
                          )}

                          {course.status === 'archived' && (
                            <span className="inline-flex items-center rounded-xs bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                              {t('statuses.archived')}
                            </span>
                          )}
                          {course.deletionRequest && <span className="inline-flex items-center rounded-xs bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">طلب الحذف في انتظار موافقة الأدمن</span>}
                        </div>
                      </td>

                      {/* التصنيف */}
                      <td className="px-4 py-3 text-muted">
                        <span className="rounded-xs bg-canvas px-2 py-0.5 text-xs font-medium">
                          {course.category}
                        </span>
                      </td>

                      {/* أنشأها */}
                      <td className="px-4 py-3 text-xs text-muted">
                        {course.authorName
                          ? getBilingualText(course.authorName, language)
                          : course.authorId}
                      </td>

                      {/* آخر تحديث Date */}
                      <td className="px-4 py-3 text-xs text-muted">
                        {formatDate(course.updatedAt)}
                      </td>

                      {/* الإجراءات */}
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/${rolePrefix}/courses/${course.id}/studio/page`}>
                            <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5">
                              <Layers size={14} />
                              <span>{t('viewStudio', 'استوديو الكورس')}</span>
                            </Button>
                          </Link>
                          <CourseShareLinks published={course.status === 'published' && Boolean(course.publishedTitle)} slug={course.slug} title={course.publishedTitle?.ar ?? courseTitle} whatsappNumber={course.publishedWhatsappNumber} />
                          {course.deletionRequest && assistant && <Button variant="outline" size="sm" onClick={() => void handleCancelDeletionRequest(course.id)}>إلغاء طلب الحذف</Button>}

                          {course.status === 'published' && (
                            <a
                              href={`/${language}/courses/${course.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title={t('viewLive', 'شوف صفحة الكورس')}
                            >
                              <IconButton
                                variant="ghost"
                                size="sm"
                                aria-label={t('viewLive', 'شوف صفحة الكورس')}
                                className="h-8 w-8 text-muted hover:text-ink"
                              >
                                <ExternalLink size={15} />
                              </IconButton>
                            </a>
                          )}

                          {!assistant && (
                            <>
                              {course.status === 'draft' && course.reviewState !== 'pending' && <Button size="sm" onClick={() => void prepareListTransition(course, 'publish')}>{t('publish', 'انشر')}</Button>}
                              {course.status === 'published' && <Button size="sm" variant="outline" onClick={() => void prepareListTransition(course, 'unpublish')}>{t('unpublish', 'إلغاء النشر')}</Button>}
                              {course.status === 'archived' ? (
                                <IconButton
                                  variant="ghost"
                                  size="sm"
                                  title={t('unarchive', 'إلغاء الأرشفة')}
                                  aria-label={t('unarchive', 'إلغاء الأرشفة')}
                                  onClick={() => void handleUnarchive(course)}
                                  className="h-8 w-8 text-muted hover:text-ink"
                                >
                                  <RefreshCw size={15} />
                                </IconButton>
                              ) : (
                                <IconButton
                                  variant="ghost"
                                  size="sm"
                                  title={t('archive', 'أرشف')}
                                  aria-label={t('archive', 'أرشف')}
                                  onClick={() => void handleArchive(course)}
                                  className="h-8 w-8 text-muted hover:text-ink"
                                >
                                  <Archive size={15} />
                                </IconButton>
                              )}

                              <IconButton
                                variant="ghost"
                                size="sm"
                                title={t('delete', 'احذف')}
                                aria-label={t('delete', 'احذف')}
                                onClick={() => setSelectedCourse(course)}
                                className="h-8 w-8 text-danger/80 hover:bg-danger/10 hover:text-danger"
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (<= 768px) */}
          <div className="grid gap-3 md:hidden">
            {coursesQuery.data.items.map((course) => {
              const courseTitle = getBilingualText(course.title, language);
              return (
                <article
                  key={course.id}
                  className="grid gap-3 rounded-md border border-border bg-surface p-4 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={course.coverImage.src || '/images/course-cover-default.webp'}
                      alt={getBilingualText(course.coverImage.alt, language) || courseTitle}
                      className="size-16 shrink-0 rounded-xs border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/${rolePrefix}/courses/${course.id}/studio/page`}
                        className="line-clamp-2 font-bold text-ink hover:text-primary hover:underline"
                      >
                        {courseTitle}
                      </Link>
                      <p className="font-mono text-xs text-muted">/{course.slug}</p>
                      <span className="mt-1 inline-block rounded-xs bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-muted">
                        {course.category}
                      </span>
                      {course.deletionRequest && <p className="mt-2 rounded-sm bg-amber-50 p-2 text-xs font-semibold text-amber-900">طلب الحذف في انتظار موافقة الأدمن · {course.deletionRequest.reason}</p>}
                      {course.deletionRequestRejection && <p className="mt-2 rounded-sm bg-rose-50 p-2 text-xs text-rose-900">تم رفض طلب الحذف: {course.deletionRequestRejection.reason}</p>}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {course.status === 'published' && (
                      <span className="rounded-xs bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        {t('statuses.published')}
                      </span>
                    )}
                    {course.hasUnpublishedChanges && (
                      <span className="rounded-xs bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">
                        {t('statuses.unpublished_changes', 'تعديلات مش منشورة')}
                      </span>
                    )}
                    {course.status === 'draft' && course.reviewState === 'pending' && (
                      <span className="rounded-xs bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        {t('statuses.pending_review')}
                      </span>
                    )}
                    {course.reviewState === 'rejected' && (
                      <span className="rounded-xs bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
                        {t('statuses.rejected')}
                      </span>
                    )}
                    {course.status === 'draft' && course.reviewState === 'none' && (
                      <span className="rounded-xs bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">
                        {t('statuses.draft')}
                      </span>
                    )}
                    {course.status === 'archived' && (
                      <span className="rounded-xs bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                        {t('statuses.archived')}
                      </span>
                    )}
                    {course.deletionRequest && <span className="rounded-xs bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">طلب الحذف في انتظار موافقة الأدمن</span>}
                  </div>
                  {course.status === 'draft' && course.reviewState === 'rejected' && course.reviewReason && <p className="rounded-sm bg-rose-50 p-2 text-xs text-rose-900">سبب الرفض: {course.reviewReason}</p>}

                  {/* Mobile الإجراءات */}
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted">{formatDate(course.updatedAt)}</span>
                    <div className="flex items-center gap-2">
                      <Link to={`/${rolePrefix}/courses/${course.id}/studio/page`}>
                        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                          <Layers size={14} />
                          <span>{t('viewStudio', 'استوديو الكورس')}</span>
                        </Button>
                      </Link>
                      <CourseShareLinks published={course.status === 'published' && Boolean(course.publishedTitle)} slug={course.slug} title={course.publishedTitle?.ar ?? courseTitle} whatsappNumber={course.publishedWhatsappNumber} />
                      {course.deletionRequest && assistant && <Button variant="outline" size="sm" onClick={() => void handleCancelDeletionRequest(course.id)}>إلغاء طلب الحذف</Button>}

                      {!assistant && (
                        <div className="flex flex-wrap justify-end gap-2">
                          {course.status === 'draft' && course.reviewState !== 'pending' && <Button size="sm" onClick={() => void prepareListTransition(course, 'publish')}>{t('publish', 'انشر')}</Button>}
                          {course.status === 'published' && <Button size="sm" variant="outline" onClick={() => void prepareListTransition(course, 'unpublish')}>{t('unpublish', 'إلغاء النشر')}</Button>}
                          <IconButton variant="ghost" size="sm" aria-label={t('delete', 'احذف')} onClick={() => setSelectedCourse(course)} className="h-8 w-8 text-danger hover:bg-danger/10"><Trash2 size={15} /></IconButton>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted">
              {t('pageOf', { page: coursesQuery.data.page, pages: coursesQuery.data.pageCount })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setFilter('page', String(page - 1))}
              >
                {t('previous')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= coursesQuery.data.pageCount}
                onClick={() => setFilter('page', String(page + 1))}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* احذف Confirmation Modal */}
      <Modal
        open={Boolean(selectedCourse)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCourse(null);
            setTypedSlug('');
          }
        }}
        title={t('deleteCourseConfirmTitle', 'احذف الكورس')}
        description={`${t('deleteCourseConfirmBody', { slug: selectedCourse?.slug ?? '' })} ${selectedCourse && (selectedCourse.enrollmentCount > 0 || selectedCourse.paymentCount > 0) ? t('softDeleteUsage', { enrollments: selectedCourse.enrollmentCount, payments: selectedCourse.paymentCount }) : t('hardDeleteWarning')}`}
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedCourse(null);
                setTypedSlug('');
              }}
            >
              {t('cancel', 'إلغاء')}
            </Button>
            <Button
              variant="danger"
              disabled={!selectedCourse || typedSlug !== selectedCourse.slug || isDeleting}
              loading={isDeleting}
              onClick={() => void handleDelete()}
            >
              {t('confirmDelete', 'تأكيد الحذف')}
            </Button>
          </div>
        }
      >
        {selectedCourse && (
          <div className="grid gap-3">
            <label htmlFor="confirm-delete-slug" className="text-xs font-semibold text-ink">
              {t('typeSlugToConfirm', { slug: selectedCourse.slug })}
            </label>
            <input
              id="confirm-delete-slug"
              dir="ltr"
              value={typedSlug}
              onChange={(e) => setTypedSlug(e.target.value)}
              placeholder={selectedCourse.slug}
              className="min-h-11 w-full rounded-sm border border-border bg-canvas px-3 font-mono text-sm outline-none focus:border-danger focus:ring-1 focus:ring-danger"
            />
            <p className="text-xs leading-relaxed text-muted">
              {selectedCourse.enrollmentCount > 0 || selectedCourse.paymentCount > 0
                ? t('softDeleteUsage', { enrollments: selectedCourse.enrollmentCount, payments: selectedCourse.paymentCount })
                : t('hardDeleteWarning')}
            </p>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(publishTarget)}
        onOpenChange={(open) => !open && setPublishTarget(null)}
        title={publishTarget?.action === 'publish' ? t('publish', 'انشر') : t('unpublish', 'إلغاء النشر')}
        description={publishTarget?.action === 'publish' ? 'هننشر النسخة الحالية ونخليها متاحة للزوار.' : 'هنخفي الكورس ونقفل التسجيل، مع الاحتفاظ بالنسخ.'}
        confirmLabel={publishTarget?.action === 'publish' ? t('publish', 'انشر') : t('unpublish', 'إلغاء النشر')}
        cancelLabel={t('cancel', 'إلغاء')}
        onConfirm={() => void confirmListTransition()}
      />
      {readinessIssues.length > 0 && readinessCourse && <ReadinessPanel issues={readinessIssues} sections={readinessCourse.draft.page.sections} onClose={() => setReadinessIssues([])} onGo={goToReadinessIssue} />}
    </section>
  );
}
