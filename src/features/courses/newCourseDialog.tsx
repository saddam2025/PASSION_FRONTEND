import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import {
  CourseDraftInputSchema,
  reservedSlugs,
  type CourseDraftInput,
} from '@/schemas/courseDraft';
import { useAuth } from '@/app/AuthContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { useToast } from '@/components/ui/feedback';
import { coursesService } from '@/services/courses';
import { coursesAdminService } from '@/services/courses.admin';
import type { CourseTemplateId } from '@/services/courses/templates';
import { NewCourseDialogContext } from './newCourseDialogStore';

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
type CourseDraftFormValues = z.input<typeof CourseDraftInputSchema>;
const blank: CourseDraftInput = { title: { ar: '', en: '' }, slug: '', category: '' };

const templateSectionNames: Record<CourseTemplateId, string[]> = {
  full: [
    'الواجهة الرئيسية',
    'إيه هو الكورس ده؟',
    'الكورس ده مناسب ليك لو...',
    'تفاصيل أكتر',
    'ليه تختار الكورس ده؟',
    'أسئلة شائعة',
    'سجّل بياناتك',
  ],
  short: ['الواجهة الرئيسية', 'تفاصيل أكتر', 'سجّل بياناتك'],
  blank: ['سجّل بياناتك'],
};

const arabicToLatin: Record<string, string> = {
  ا: 'a', أ: 'a', إ: 'i', آ: 'a', ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h', خ: 'kh',
  د: 'd', ذ: 'dh', ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's', ض: 'd', ط: 't', ظ: 'z',
  ع: 'a', غ: 'gh', ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'h', و: 'w',
  ؤ: 'w', ي: 'y', ى: 'a', ئ: 'y', ة: 'a', ء: '',
};

function suggestLatinSlug(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .split('')
    .map((char) => arabicToLatin[char] ?? char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

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
  const form = useForm<CourseDraftFormValues, unknown, CourseDraftInput>({
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
  const sequence = useRef(0);
  const slug = form.watch('slug');
  const arabicTitle = form.watch('title.ar');
  const fallbackSlug = useRef(`course-${crypto.randomUUID().slice(0, 4)}`);

  const create = useMutation({
    mutationFn: async (input: CourseDraftInput) => {
      const res = await coursesService.create({
        title: input.title,
        category: input.category,
        slug: input.slug,
        template,
      });
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    onSuccess: async (course) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['courses-list'] }),
        client.invalidateQueries({ queryKey: ['admin-overview'] }),
      ]);
      toast.notify({ title: t('courseCreated', 'تم إنشاء الكورس'), tone: 'success' });
      form.reset(blank);
      onOpenChange(false);
      const rolePrefix = user?.role === 'assistant' ? 'assistant' : 'admin';
      navigate(`/${rolePrefix}/courses/${course.id}/studio/page`);
    },
    onError: (error: Error) => {
      form.setError('root.server', { message: error.message });
      toast.notify({ title: error.message, tone: 'danger' });
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(blank);
    setSlugState('empty');
    setTemplate('full');
  }, [open, form]);

  // Live slug uniqueness check
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
      void coursesService.checkSlug(slug).then((res) => {
        if (current === sequence.current) {
          setSlugState(res.ok && res.data ? 'available' : 'taken');
        }
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, slug]);

  // Keep the transliterated suggestion current until the slug is manually edited.
  useEffect(() => {
    if (form.getFieldState('slug').isDirty) return;
    const generated = suggestLatinSlug(arabicTitle) || fallbackSlug.current;
    form.setValue('slug', generated, { shouldValidate: true });
  }, [arabicTitle, form]);

  const close = (next: boolean) => {
    if (!next && create.isPending) return;
    if (!next && form.formState.isDirty && !window.confirm(t('discardPrompt', 'تجاهل التغييرات اللي لسه ما اتحفظتش؟'))) {
      return;
    }
    if (!next) form.reset(blank);
    onOpenChange(next);
  };

  const sectionList = (key: CourseTemplateId) => templateSectionNames[key].join(' · ');

  const slugText =
    slugState === 'checking'
      ? t('slugChecking', 'جاري التحقق من التوفر…')
      : slugState === 'available'
        ? t('slugAvailable', 'الرابط متاح')
        : slugState === 'taken'
          ? t('slugTaken', 'الرابط مستخدم بالفعل')
          : slugState === 'invalid'
            ? t('slugInvalid', 'صيغة الرابط مش صحيحة')
            : '';

  const canSubmit =
    form.formState.isValid && slugState === 'available' && Boolean(form.watch('category'));

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={t('newCourse')}
      description={t('newCourseIntro')}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={create.isPending}
            onClick={() => close(false)}
          >
            {t('cancel', 'إلغاء')}
          </Button>
          <Button
            type="submit"
            form="new-course-dialog-form"
            disabled={!canSubmit || create.isPending}
            loading={create.isPending}
          >
            {t('createDraft', 'إنشاء كورس')}
          </Button>
        </div>
      }
    >
      <form
        id="new-course-dialog-form"
        className="grid gap-4"
        onSubmit={form.handleSubmit((input) => create.mutate(input))}
      >
        <div className="grid gap-1">
          <label htmlFor="course-title-ar" className="text-sm font-semibold text-ink">
            {t('titleAr', 'عنوان الكورس بالعربي')}
          </label>
          <input
            id="course-title-ar"
            lang="ar"
            dir="rtl"
            className="min-h-11 rounded-xs border border-border bg-canvas px-3 text-start text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="مثال: مهارات القيادة المتقدمة"
            {...form.register('title.ar')}
          />
          {form.formState.errors.title?.message && (
            <p role="alert" className="text-xs text-danger">
              {t('titleRequired', 'اكتب عنوان الكورس باللغة العربية.')}
            </p>
          )}
        </div>

        <div className="grid gap-1">
          <label htmlFor="course-category" className="text-sm font-semibold text-ink">
            {t('category', 'التصنيف')}
          </label>
          <select
            id="course-category"
            className="min-h-11 rounded-xs border border-border bg-canvas px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            {...form.register('category')}
            disabled={categories.isLoading}
          >
            <option value="">{t('allCategories', 'اختار التصنيف')}</option>
            {categories.data?.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1">
          <label htmlFor="course-slug" className="text-sm font-semibold text-ink">
            {t('slug', 'الرابط المختصر')} <span className="text-danger">· مطلوب</span>
          </label>
          <input
            id="course-slug"
            dir="ltr"
            className="min-h-11 rounded-xs border border-border bg-canvas px-3 text-start font-mono text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="course-title"
            {...form.register('slug')}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">{t('slugFormat')}</span>
            {slugText && (
              <span
                role="status"
                className={
                  slugState === 'available'
                    ? 'font-medium text-emerald-600'
                    : slugState === 'taken' || slugState === 'invalid'
                      ? 'font-medium text-danger'
                      : 'text-muted'
                }
              >
                {slugText}
              </span>
            )}
          </div>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold text-ink">{t('startFrom', 'ابدأ من قالب')}</legend>
          <div className="grid gap-2">
            {(['full', 'short', 'blank'] as const).map((key) => {
              const active = template === key;
              return (
                <label
                  key={key}
                  className={`grid cursor-pointer gap-1.5 rounded-sm border p-3 transition ${
                    active
                      ? 'border-primary bg-primary/5 shadow-xs'
                      : 'border-border bg-surface hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="course-template"
                      value={key}
                      checked={active}
                      onChange={() => setTemplate(key)}
                      className="size-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-bold text-ink">
                      {key === 'full'
                        ? t('templates.full', 'صفحة كاملة (موصى بها)')
                        : key === 'short'
                          ? t('templates.short', 'صفحة مختصرة')
                          : t('templates.blank', 'فارغ')}
                    </span>
                  </div>
                  <p className="ps-6.5 text-xs leading-relaxed text-muted">
                    {sectionList(key)}
                  </p>
                </label>
              );
            })}
          </div>
        </fieldset>

        {form.formState.errors.root?.server?.message && (
          <p role="alert" className="text-sm text-danger">
            {form.formState.errors.root.server.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
