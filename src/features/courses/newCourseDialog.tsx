import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CourseDraftInputSchema,
  reservedSlugs,
  type CourseDraftInput,
} from '@/schemas/courseDraft';
import { useAuth } from '@/app/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { useToast } from '@/components/ui/feedback';
import { coursesAdminService } from '@/services/courses.admin';
import { NewCourseDialogContext } from './newCourseDialogStore';
import { courseTemplateSections, type CourseTemplateId } from './templates';
export function NewCourseDialogProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const api = useMemo(() => ({ open: () => setIsOpen(true), close: () => setIsOpen(false) }), []);
  return (
    <NewCourseDialogContext.Provider value={api}>
      {children}
      <NewCourseDialog open={isOpen} onOpenChange={setIsOpen} />
    </NewCourseDialogContext.Provider>
  );
}

type SlugState = 'empty' | 'checking' | 'available' | 'taken' | 'invalid';
const blank: CourseDraftInput = { title: { ar: '', en: '' }, slug: '', category: '' };
function NewCourseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('courses');
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const client = useQueryClient();
  const form = useForm<CourseDraftInput>({
    resolver: zodResolver(CourseDraftInputSchema),
    mode: 'onChange',
    defaultValues: blank,
  });
  const categories = useQuery({
    queryKey: ['course-categories'],
    queryFn: () => coursesAdminService.categories(),
    enabled: open,
  });
  const [slugState, setSlugState] = useState<SlugState>('empty');
  const [template, setTemplate] = useState<CourseTemplateId>('full');
  const requestId = useRef('');
  const sequence = useRef(0);
  const slug = form.watch('slug');
  const englishTitle = form.watch('title.en');
  const create = useMutation({
    mutationFn: (input: CourseDraftInput) =>
      coursesAdminService.createDraft(input, requestId.current, template),
    onSuccess: async (course) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin-courses'] }),
        client.invalidateQueries({ queryKey: ['course', course.id] }),
        client.invalidateQueries({ queryKey: ['admin-overview'] }),
      ]);
      toast.notify({ title: t('courseCreated'), tone: 'success' });
      form.reset(blank);
      onOpenChange(false);
      navigate(`/${user?.role === 'assistant' ? 'assistant' : 'admin'}/courses/${course.id}/studio`, { state: { showStudioTip: true } });
    },
    onError: (error: unknown) => {
      const code = error instanceof Error && 'code' in error ? error.code : undefined;
      const key =
        code === 'slug_taken'
          ? 'slugTaken'
          : code === 'forbidden'
            ? 'createForbidden'
            : code === 'validation' || code === 'invalid'
              ? 'createValidationError'
              : 'unknownError';
      const message = t(key);
      form.setError('root.server', { message });
      toast.notify({ title: message, tone: 'danger' });
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(blank);
    requestId.current = crypto.randomUUID();
    setSlugState('empty');
    setTemplate('full');
  }, [open, form]);
  useEffect(() => {
    const current = ++sequence.current;
    if (!open || !slug) {
      setSlugState('empty');
      return;
    }
    if (
      slug.length < 3 ||
      slug.length > 80 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      reservedSlugs.has(slug)
    ) {
      setSlugState('invalid');
      return;
    }
    setSlugState('checking');
    const timer = window.setTimeout(() => {
      void coursesAdminService
        .checkSlug(slug)
        .then((available) => {
          if (current === sequence.current) setSlugState(available ? 'available' : 'taken');
        })
        .catch(() => {
          if (current === sequence.current) setSlugState('invalid');
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [open, slug]);
  useEffect(() => {
    if (!englishTitle.trim() || form.getFieldState('slug').isDirty) return;
    form.setValue(
      'slug',
      englishTitle
        .trim()
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      { shouldValidate: true },
    );
  }, [englishTitle, form]);

  const close = (next: boolean) => {
    if (!next && create.isPending) return;
    if (!next && form.formState.isDirty && !window.confirm(t('discardPrompt'))) return;
    if (!next) form.reset(blank);
    onOpenChange(next);
  };
  const slugText = t(`slugStatus.${slugState}`);
  const none = !categories.isLoading && !categories.isError && !categories.data?.length;
  const canSubmit =
    form.formState.isValid && slugState === 'available' && Boolean(categories.data?.length);
  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={t('newCourse')}
      description={t('newCourseIntro')}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={create.isPending}
            onClick={() => close(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            form="new-course-form"
            disabled={!canSubmit || create.isPending}
            loading={create.isPending}
          >
            {t('createDraft')}
          </Button>
        </>
      }
    >
      <form
        id="new-course-form"
        className="grid gap-4"
        onSubmit={form.handleSubmit((input) => create.mutate(input))}
      >
        <label className="grid gap-1 text-sm">
          {t('titleAr')}
          <input
            lang="ar"
            dir="rtl"
            aria-label={t('titleAr')}
            className="min-h-11 rounded-xs border border-border bg-canvas px-3 text-start"
            {...form.register('title.ar')}
          />
        </label>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold">{t('startFrom')}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(['full', 'short', 'blank'] as const).map((key) => (
              <label key={key} className={`grid cursor-pointer gap-2 rounded-sm border p-3 text-sm ${template === key ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <span className="flex items-center gap-2 font-semibold">
                  <input type="radio" name="course-template" checked={template === key} onChange={() => setTemplate(key)} />
                  {t(`templates.${key}`)}
                </span>
                <span className="text-xs text-muted">{courseTemplateSections[key].map((type) => t(`templateSections.${type}`)).join(' · ')}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-1 text-sm">
          {t('titleEn')}
          <input
            lang="en"
            dir="ltr"
            aria-label={t('titleEn')}
            className="min-h-11 rounded-xs border border-border bg-canvas px-3 text-start"
            {...form.register('title.en')}
          />
        </label>
        {form.formState.errors.title?.message && (
          <p role="alert" className="text-xs text-danger">
            {t('titleRequired')}
          </p>
        )}
        <label className="grid gap-1 text-sm">
          {t('category')}
          <select
            aria-label={t('category')}
            className="min-h-11 rounded-xs border border-border bg-canvas px-3"
            {...form.register('category')}
            disabled={categories.isLoading || none}
          >
            <option value="">{t('chooseCategory')}</option>
            {categories.data?.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {categories.isLoading && <span className="text-xs text-muted">{t('loading')}</span>}
          {categories.isError && (
            <span role="alert" className="text-xs text-danger">
              {t('categoryLoadError')}
            </span>
          )}
          {none &&
            (user?.role === 'admin' ? (
              <a href="/admin/settings" className="text-xs text-primary-strong underline">
                {t('noCategoriesAdmin')}
              </a>
            ) : (
              <span className="text-xs text-muted">{t('noCategoriesAssistant')}</span>
            ))}
        </label>
        <label className="grid gap-1 text-sm">
          {t('slug')}
          <input
            dir="ltr"
            aria-label={t('slug')}
            aria-invalid={slugState === 'invalid' || slugState === 'taken'}
            className="min-h-11 rounded-xs border border-border bg-canvas px-3 text-start"
            {...form.register('slug')}
          />
          <span
            role="status"
            className={
              slugState === 'taken' || slugState === 'invalid'
                ? 'text-xs text-danger'
                : 'text-xs text-muted'
            }
          >
            {slugText}
          </span>
        </label>
        {form.formState.errors.root?.server?.message && (
          <p role="alert" className="text-sm text-danger">
            {form.formState.errors.root.server.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
