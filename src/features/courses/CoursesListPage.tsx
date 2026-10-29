import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { EmptyState, ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { coursesAdminService } from '@/services/courses.admin';
import type { CourseStatus } from '@/schemas/course';
import { mockCourseCategories } from '@/mocks/categories';
import { CourseListEntries, type CourseListItem } from './CourseListEntries';
import { useNewCourseDialog } from './newCourseDialogStore';

const statuses: Array<CourseStatus | 'all'> = [
  'all',
  'draft',
  'pending_review',
  'published',
  'rejected',
  'archived',
];
export default function CoursesListPage({ assistant = false }: { assistant?: boolean }) {
  const { t } = useTranslation('courses');
  const [params, setParams] = useSearchParams();
  const newCourse = useNewCourseDialog();
  const client = useQueryClient();
  const toast = useToast();
  const [query, setQuery] = useState(params.get('search') ?? '');
  const [selected, setSelected] = useState<CourseListItem | null>(null);
  const [typedSlug, setTypedSlug] = useState('');
  const status = (params.get('status') as CourseStatus | 'all' | null) ?? 'all';
  const page = Math.max(1, Number(params.get('page') ?? 1));
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (query) next.set('search', query);
      else next.delete('search');
      next.set('page', '1');
      if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [params, query, setParams]);
  useEffect(() => {
    if (params.get('new') !== '1') return;
    newCourse.open();
    const next = new URLSearchParams(params);
    next.delete('new');
    setParams(next, { replace: true });
  }, [newCourse, params, setParams]);
  const result = useQuery({
    queryKey: [
      'admin-courses',
      status,
      params.get('search'),
      params.get('category'),
      params.get('sort'),
      page,
    ],
    queryFn: () =>
      coursesAdminService.list({
        status,
        search: params.get('search') ?? '',
        category: params.get('category') ?? '',
        sort: (params.get('sort') as 'newest' | 'oldest' | 'title' | null) ?? 'newest',
        page,
        pageSize: 10,
      }),
  });
  const categoryQuery = useQuery({
    queryKey: ['course-categories'],
    queryFn: () => coursesAdminService.categories(),
  });
  const usageQuery = useQuery({
    queryKey: ['course-usage', selected?.id],
    enabled: Boolean(selected),
    queryFn: () => coursesAdminService.usage(selected!.id),
  });
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setParams(next);
  };
  const archive = async (course: CourseListItem) => {
    try {
      await coursesAdminService.archive(course.id);
      await client.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.notify({ title: t('archiveSuccess'), tone: 'success' });
    } catch {
      toast.notify({ title: t('unknownError'), tone: 'danger' });
    }
  };
  const unarchive = async (course: CourseListItem) => {
    try {
      await coursesAdminService.unarchive(course.id);
      await client.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.notify({ title: t('unarchiveSuccess'), tone: 'success' });
    } catch {
      toast.notify({ title: t('unknownError'), tone: 'danger' });
    }
  };
  const remove = async () => {
    if (!selected) return;
    try {
      const outcome = await coursesAdminService.remove(selected.id);
      await client.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.notify({
        title: t(outcome.softDeleted ? 'softDeleteSuccess' : 'deleteSuccess'),
        tone: 'success',
      });
      setSelected(null);
      setTypedSlug('');
    } catch {
      toast.notify({ title: t('unknownError'), tone: 'danger' });
    }
  };
  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {t(assistant ? 'assistantCourses' : 'manageCourses')}
          </h1>
          <p className="mt-1 text-sm text-muted">{t('courseListIntro')}</p>
        </div>
        <Button onClick={newCourse.open}>{t('newCourse')}</Button>
      </header>
      <div className="flex flex-wrap gap-3">
        <input
          aria-label={t('search')}
          className="min-h-11 min-w-56 flex-1 rounded-sm border border-border bg-surface px-3"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('search')}
        />
        <div role="group" aria-label={t('status')} className="flex flex-wrap gap-2">
          {statuses.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={status === item}
              className={`min-h-11 rounded-pill border px-3 text-sm ${status === item ? 'border-primary bg-primary/10 text-primary-strong' : 'border-border bg-surface'}`}
              onClick={() => setFilter('status', item)}
            >
              {t(`statuses.${item}`)}
            </button>
          ))}
        </div>
        <select
          aria-label={t('category')}
          className="min-h-11 rounded-sm border border-border bg-surface px-3"
          value={params.get('category') ?? ''}
          onChange={(event) => setFilter('category', event.target.value)}
        >
          <option value="">{t('allCategories')}</option>
          {(categoryQuery.data ?? mockCourseCategories).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          aria-label={t('sort')}
          className="min-h-11 rounded-sm border border-border bg-surface px-3"
          value={params.get('sort') ?? 'newest'}
          onChange={(event) => setFilter('sort', event.target.value)}
        >
          <option value="newest">{t('sortNewest')}</option>
          <option value="oldest">{t('sortOldest')}</option>
          <option value="title">{t('sortTitle')}</option>
        </select>
      </div>
      {result.isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} variant="card" />
          ))}
        </div>
      ) : result.isError ? (
        <ErrorState title={t('loadError')} onRetry={() => void result.refetch()} />
      ) : !result.data?.items.length ? (
        <EmptyState
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={<Button onClick={newCourse.open}>{t('createFirstCourse')}</Button>}
        />
      ) : (
        <>
          <CourseListEntries
            items={result.data.items}
            assistant={assistant}
            onArchive={(course) => void archive(course)}
            onUnarchive={(course) => void unarchive(course)}
            onDelete={setSelected}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">
              {t('pageOf', { page: result.data.page, pages: Math.max(1, result.data.pageCount) })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setFilter('page', String(page - 1))}
              >
                {t('previous')}
              </Button>
              <Button
                variant="secondary"
                disabled={page >= result.data.pageCount}
                onClick={() => setFilter('page', String(page + 1))}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        </>
      )}
      <Modal
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setTypedSlug('');
          }
        }}
        title={t('deleteCourse')}
        description={t('typeSlugToConfirm', { slug: selected?.details.slug ?? '' })}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setSelected(null);
                setTypedSlug('');
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={!selected || typedSlug !== selected.details.slug || usageQuery.isLoading}
              onClick={() => void remove()}
            >
              {t('confirmDelete')}
            </Button>
          </>
        }
      >
        {selected && (
          <>
            <input
              dir="ltr"
              aria-label={t('slug')}
              className="min-h-11 w-full rounded-sm border border-border px-3 text-start"
              value={typedSlug}
              onChange={(event) => setTypedSlug(event.target.value)}
            />
            <p className="text-sm text-muted">
              {usageQuery.data?.enrollmentCount || usageQuery.data?.paymentCount
                ? t('softDeleteUsage', {
                    enrollments: usageQuery.data.enrollmentCount,
                    payments: usageQuery.data.paymentCount,
                  })
                : t('hardDeleteWarning')}
            </p>
          </>
        )}
      </Modal>
    </section>
  );
}
