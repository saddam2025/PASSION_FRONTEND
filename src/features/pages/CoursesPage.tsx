import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/fields';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { CourseCard } from '@/features/public/courses/CourseCard';
import { publicCoursesService as coursesService } from '@/services/courses';
import type { CourseSummary } from '@/services/courses.types';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { useSeo } from '@/lib/useSeo';
export default function CoursesPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [items, setItems] = useState<CourseSummary[]>([]);
  const [categories, setCategories] = useState<{ ar: string; en: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [categoriesError, setCategoriesError] = useState(false);
  const [categoriesAttempt, setCategoriesAttempt] = useState(0);
  const { language } = useLanguage();
  const { t } = useTranslation('courses');
  const category = params.get('category') ?? '';
  const sort = (params.get('sort') ?? 'newest') as 'newest' | 'price' | 'startDate';
  const page = Math.max(1, Number(params.get('page') || '1'));
  useSeo({ title: t('title'), description: t('intro'), language });
  useEffect(() => {
    setSearch(params.get('search') ?? '');
  }, [params]);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      if (search.trim()) next.set('search', search.trim());
      else next.delete('search');
      next.delete('page');
      if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(id);
  }, [search, params, setParams]);
  useEffect(() => {
    let live = true;
    setCategoriesError(false);
    void coursesService.getCategories().then((x) => live && setCategories(x)).catch(() => live && setCategoriesError(true));
    return () => {
      live = false;
    };
  }, [categoriesAttempt]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(false);
    void coursesService
      .list({ search: params.get('search') ?? '', category, page, pageSize: 9, sort })
      .then((r) => {
        if (live) {
          setItems(r.items);
          setTotal(r.total);
          setPages(r.pageCount);
        }
      })
      .catch(() => live && setError(true))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [params, category, page, sort, attempt]);
  const set = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };
  const reset = () => {
    setSearch('');
    setParams({});
  };
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-7 ps-container pe-container py-section">
      <header className="grid gap-3">
        <p className="text-sm font-semibold text-primary-strong">{t('eyebrow')}</p>
        <h1 className="text-4xl font-bold">{t('title')}</h1>
        <p className="max-w-2xl text-muted">{t('intro')}</p>
      </header>
      <div className="grid gap-4 rounded-md border border-border bg-surface p-4 md:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">{t('search')}</span>
          <Search aria-hidden="true" className="absolute start-3 top-3.5 text-muted" size={18} />
          <Input
            className="ps-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
          />
        </label>
        <label className="grid gap-1 text-sm md:min-w-48">
          <span>{t('sort')}</span>
          <Select
            value={sort}
            options={[
              { value: 'newest', label: t('sortNewest') },
              { value: 'price', label: t('sortPrice') },
              { value: 'startDate', label: t('sortDate') },
            ]}
            onValueChange={(v) => set('sort', v === 'newest' ? '' : v)}
          />
        </label>
        <div className="hidden flex-wrap gap-2 md:flex md:col-span-2">
          <button
            onClick={() => set('category', '')}
            className={`min-h-11 rounded-full ps-4 pe-4 ${!category ? 'bg-primary-strong text-white' : 'border border-border'}`}
          >
            {t('allCategories')}
          </button>
          {categories.map((c) => {
            const val = c.ar;
            return (
              <button
                key={val}
                onClick={() => set('category', val)}
                className={`min-h-11 rounded-full ps-4 pe-4 ${category === val ? 'bg-primary-strong text-white' : 'border border-border'}`}
              >
                {getBilingualText(c, language)}
              </button>
            );
          })}
        </div>
        <label className="grid gap-1 text-sm md:hidden">
          <span>{t('category')}</span>
          <Select
            value={category || 'all'}
            options={[
              { value: 'all', label: t('allCategories') },
              ...categories.map((c) => ({
                value: c.ar,
                label: getBilingualText(c, language),
              })),
            ]}
            onValueChange={(v) => set('category', v === 'all' ? '' : v)}
          />
        </label>
      </div>
      {categoriesError && <ErrorState title="حصلت مشكلة في تحميل التصنيفات، جرّب تاني." onRetry={() => setCategoriesAttempt((value) => value + 1)} />}
      <p className="text-sm text-muted" aria-live="polite">
        {t('results', { count: total })}
      </p>
      {error ? (
        <ErrorState title={t('error')} onRetry={() => setAttempt((value) => value + 1)} />
      ) : loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} variant="card" className="h-80" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button variant="secondary" onClick={reset}>
              {t('reset')}
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
          <nav className="flex items-center justify-center gap-4" aria-label={t('pagination')}>
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => set('page', String(page - 1))}
            >
              {t('previous')}
            </Button>
            <span>{t('page', { current: page, total: pages })}</span>
            <Button
              variant="secondary"
              disabled={page >= pages}
              onClick={() => set('page', String(page + 1))}
            >
              {t('next')}
            </Button>
          </nav>
        </>
      )}
    </div>
  );
}
