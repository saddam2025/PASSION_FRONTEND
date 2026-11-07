import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/fields';
import { Modal } from '@/components/ui/Overlay';
import { useToast } from '@/components/ui/feedback';
import { reservedSlugs } from '@/schemas/courseDraft';
import { coursesAdminService } from '@/services/courses.admin';
import { courseCopySlug } from '@/lib/courseSlug';

type SourceCourse = { id: string; title?: { ar: string }; slug: string; deletedAt?: string; draft?: { details: { title: { ar: string } } } };
type SlugState = 'empty' | 'checking' | 'available' | 'taken' | 'invalid';

export function DuplicateCourseDialog({
  course,
  open,
  onOpenChange,
}: {
  course: SourceCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('courses');
  const client = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>('empty');
  const [slugError, setSlugError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const requestSequence = useRef(0);
  const submitGuard = useRef(false);

  useEffect(() => {
    if (!open || !course) return;
    const nextTitle = `نسخة من ${course.title?.ar || course.draft?.details.title.ar || course.slug}`;
    setTitle(nextTitle);
    setSlug(courseCopySlug(nextTitle));
    setSlugManuallyEdited(false);
    setSlugState('checking');
    setSlugError('');
    setSubmitError('');
  }, [open, course]);

  useEffect(() => {
    const request = ++requestSequence.current;
    setSlugError('');
    if (!open || !course || !slug) {
      setSlugState('empty');
      return;
    }
    if (slug.length < 3 || slug.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || reservedSlugs.has(slug)) {
      setSlugState('invalid');
      return;
    }
    setSlugState('checking');
    const timer = window.setTimeout(() => {
      void coursesAdminService.checkSlug(slug).then((available) => {
        if (request === requestSequence.current) setSlugState(available ? 'available' : 'taken');
      }).catch((error: unknown) => {
        if (request !== requestSequence.current) return;
        setSlugState('invalid');
        setSlugError(error instanceof Error ? error.message : t('unknownError'));
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, course, slug, t]);

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    if (!next) {
      requestSequence.current += 1;
      setTitle('');
      setSlug('');
      setSlugManuallyEdited(false);
      setSubmitError('');
      setSlugError('');
    }
    onOpenChange(next);
  };

  const handleTitleChange = (next: string) => {
    setTitle(next);
    setSubmitError('');
    if (!slugManuallyEdited) setSlug(courseCopySlug(next));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitGuard.current || !course || course.deletedAt || !title.trim() || title.trim().length > 180 || slugState !== 'available') return;
    submitGuard.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const copy = await coursesAdminService.duplicate(course.id, { title: { ar: title.trim() }, slug });
      await client.invalidateQueries({ queryKey: ['courses-list'] });
      toast.notify({ title: t('duplicateSuccess'), tone: 'success' });
      onOpenChange(false);
      navigate(`/admin/courses/${copy.id}/studio/details`);
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
      if (code === 'CONFLICT' || code === 'VALIDATION_ERROR') {
        setSlugState('taken');
        setSlugError(t('slugTaken'));
      } else {
        setSubmitError(error instanceof Error ? error.message : t('unknownError'));
      }
    } finally {
      submitGuard.current = false;
      setSubmitting(false);
    }
  };

  const slugStatusText = slugError || (slugState === 'checking' ? t('slugChecking')
    : slugState === 'available' ? t('slugAvailable')
      : slugState === 'taken' ? t('slugTaken')
        : slugState === 'invalid' ? t('slugInvalid') : t('slugStatus.empty'));
  const validTitle = Boolean(title.trim()) && title.trim().length <= 180;
  const canSubmit = validTitle && slugState === 'available' && !submitting && Boolean(course && !course.deletedAt);

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={t('duplicateTitle')}
      footer={
        <>
          <Button type="button" variant="secondary" disabled={submitting} onClick={() => handleOpenChange(false)}>{t('cancel')}</Button>
          <Button type="submit" form="duplicate-course-form" disabled={!canSubmit} loading={submitting}>{submitting ? t('duplicating') : t('duplicateAction')}</Button>
        </>
      }
    >
      <form id="duplicate-course-form" className="grid gap-4" onSubmit={(event) => void submit(event)}>
        <div className="grid gap-1.5">
          <label htmlFor="duplicate-course-title" className="text-sm font-semibold text-ink">{t('duplicateNewTitle')}</label>
          <Input id="duplicate-course-title" lang="ar" dir="rtl" maxLength={180} value={title} onChange={(event) => handleTitleChange(event.target.value)} />
          {!validTitle && <p role="alert" className="text-xs text-danger">{t('titleRequired')}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="duplicate-course-slug" className="text-sm font-semibold text-ink">{t('slug')}</label>
          <Input id="duplicate-course-slug" dir="ltr" maxLength={80} value={slug} onChange={(event) => { setSlugManuallyEdited(true); setSlug(event.target.value); setSlugError(''); }} />
          <p role={slugState === 'taken' || slugState === 'invalid' ? 'alert' : 'status'} className={`text-xs ${slugState === 'available' ? 'text-success' : slugState === 'taken' || slugState === 'invalid' ? 'text-danger' : 'text-muted'}`}>{slugStatusText}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted">{t('duplicateNote')}</p>
        {submitError && <p role="alert" className="text-sm text-danger">{submitError}</p>}
      </form>
    </Modal>
  );
}
