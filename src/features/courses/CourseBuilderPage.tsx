import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useBlocker, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/feedback';
import {
  PageConfigSchema,
  SectionSchema,
  type PageConfig,
  type Section,
  type SectionType,
  isSectionEmpty,
  SECTION_REGISTRY_META,
} from '@/schemas/sections';
import { checkReadiness } from '@/schemas/courseReadiness';
import type { CourseRecord } from '@/schemas/course';
import { revisionsService } from '@/services/revisions';
import { CoursePagePreview } from './CoursePagePreview';
import { coursesAdminService } from '@/services/courses.admin';
import { useAuth } from '@/app/AuthContext';
import { Modal } from '@/components/ui/Overlay';
import { SectionFieldsEditor } from './editor/SectionFieldsEditor';
import { SectionPalette } from './editor/SectionPalette';

function newSection(type: SectionType): Section {
  return SectionSchema.parse({
    id: crypto.randomUUID(),
    type,
    visible: true,
    settings: { background: 'none', spacing: 'lg', width: 'contained', align: 'start', dividerTop: 'none', dividerBottom: 'none', reveal: 'none' },
    content: SECTION_REGISTRY_META[type].defaultContent(),
  });
}
export function CourseBuilderPage({
  course,
  assistant,
}: {
  course: CourseRecord;
  assistant: boolean;
}) {
  const { t, i18n } = useTranslation('courses');
  const [page, setPage] = useState<PageConfig>(course.pageConfig);
  const [message, setMessage] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [previewInteractions, setPreviewInteractions] = useState(false);
  const client = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const area = assistant ? 'assistant' : 'admin';
  const revisions = useQuery({
    queryKey: ['revisions', course.id],
    queryFn: () => revisionsService.listForCourse(course.id),
  });
  const pending =
    course.status === 'pending_review' ||
    Boolean(revisions.data?.some((revision) => revision.status === 'pending_review'));
  const editableRevision = useQuery({
    queryKey: ['builder-revision', course.id],
    enabled: !pending && !revisions.isLoading,
    queryFn: () => revisionsService.ensureEditableRevision(course),
  });
  useEffect(() => {
    if (editableRevision.data) setPage(editableRevision.data.snapshot.pageConfig);
  }, [editableRevision.data]);
  const readiness = checkReadiness({ details: course.details, pageConfig: page });
  const dirty = Boolean(editableRevision.data && JSON.stringify(page) !== JSON.stringify(editableRevision.data.snapshot.pageConfig));
  const blocker = useBlocker(dirty && !pending);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  const save = useMutation({
    mutationFn: async () => {
      const validated = PageConfigSchema.parse(page);
      if (!editableRevision.data) throw new Error('Editable revision is unavailable');
      return revisionsService.save(
        editableRevision.data.id,
        course.details,
        validated,
        course.publishedVersion,
      );
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['course', course.id] }),
        client.invalidateQueries({ queryKey: ['revisions', course.id] }),
        client.invalidateQueries({ queryKey: ['builder-revision', course.id] }),
      ]);
      toast.notify({ title: t('saved'), tone: 'success' });
      setMessage('');
    },
    onError: () => setMessage(t('saveError')),
  });
  const move = (index: number, direction: -1 | 1) =>
    setPage((current) => {
      const sections = [...current.sections];
      const target = index + direction;
      if (target < 0 || target >= sections.length) return current;
      [sections[index], sections[target]] = [sections[target]!, sections[index]!];
      return { ...current, sections };
    });
  const moveTo = (from: number, to: number) => setPage((current) => {
    if (from === to || to < 0 || to >= current.sections.length) return current;
    const sections = [...current.sections];
    const [picked] = sections.splice(from, 1);
    if (picked) sections.splice(to, 0, picked);
    return { ...current, sections };
  });
  const updateSection = (index: number, update: Partial<Section>) =>
    setPage((current) => ({
      ...current,
      sections: current.sections.map((section, at) =>
        at === index ? ({ ...section, ...update } as Section) : section,
      ),
    }));
  const submit = async () => {
    setMessage('');
    try {
      await save.mutateAsync();
      if (!editableRevision.data) throw new Error('Editable revision is unavailable');
      await revisionsService.submit(editableRevision.data.id);
      await client.invalidateQueries({ queryKey: ['revisions', course.id] });
      navigate(assistant ? '/assistant/submissions' : '/admin/review');
    } catch {
      setMessage(t('submitError'));
    }
  };
  const publish = async () => {
    if (readiness.errors.length || pending || !window.confirm(t('publishConfirm'))) return;
    try {
      await save.mutateAsync();
      await coursesAdminService.publishDirect(course.id);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['course', course.id] }),
        client.invalidateQueries({ queryKey: ['revisions', course.id] }),
        client.invalidateQueries({ queryKey: ['admin-courses'] }),
      ]);
      setMessage(t('publishSuccess'));
      toast.notify({ title: t('publishSuccess'), tone: 'success', action: { label: t('viewLive'), href: `/${i18n.language}/courses/${course.details.slug}` } });
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? error.code : undefined;
      setMessage(code === 'pending_assistant_revision' ? t('pendingAssistantRevision') : t('publishError'));
    }
  };
  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={`/${area}/courses/${course.id}`} className="text-sm underline">
            {t('backToCourse')}
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{t('openBuilder')}</h1>
          <p className="text-sm text-muted">{t('builderIntro')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/${area}/courses/${course.id}/preview`}
            className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-sm"
          >
            {t('previewPage')}
          </Link>
          <Button
            variant="secondary"
            disabled={save.isPending || pending || editableRevision.isLoading}
            onClick={() => void save.mutateAsync()}
          >
            {t('saveDraft')}
          </Button>
          {user?.role === 'admin' ? (
            <Button disabled={pending || editableRevision.isLoading} onClick={() => void publish()}>
              {t(course.status === 'published' ? 'publishChanges' : 'publish')}
            </Button>
          ) : (
            <Button disabled={pending || editableRevision.isLoading} onClick={() => void submit()}>
              {t('submitReview')}
            </Button>
          )}
        </div>
      </header>
      {pending && (
        <p role="status" className="rounded-sm border border-warning/30 bg-warning/5 p-4">
          {t('pendingReadOnly')}
        </p>
      )}
      {editableRevision.isLoading && !pending ? (
        <p role="status" className="text-sm text-muted">
          {t('loadingRevision')}
        </p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[20rem_1fr]">
          <aside className="grid content-start gap-3 rounded-sm border border-border bg-surface p-4">
            <h2 className="font-bold">{t('pageSections')}</h2>
            {page.sections.map((section, index) => (
              <article key={section.id} draggable={!pending} onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragIndex !== null) moveTo(dragIndex, index); setDragIndex(null); }} onDragEnd={() => setDragIndex(null)} className={`grid gap-2 rounded-xs border p-3 ${isSectionEmpty(section, { price: course.details.pricing.price, promoPrice: course.details.pricing.promoPrice, registrationOpen: course.details.enrollment.registrationOpen }) ? 'border-dashed border-muted' : 'border-border'}`}>
                <strong>{t(`sectionTypes.${section.type}`)}</strong>
                {isSectionEmpty(section, { price: course.details.pricing.price, promoPrice: course.details.pricing.promoPrice, registrationOpen: course.details.enrollment.registrationOpen }) && <span className="text-xs text-muted">{t('emptySection')}</span>}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={pending || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={t('moveUp')}
                  >
                    {t('moveUp')}
                  </Button>
                  <details className="w-full border-t border-border pt-2">
                    <summary className="min-h-10 cursor-pointer py-2 text-sm font-semibold">{t('editSection')}</summary>
                    <SectionFieldsEditor section={section} onChange={(updated) => setPage((current) => ({ ...current, sections: current.sections.map((item, at) => at === index ? updated : item) }))} />
                    <div className="grid gap-2 pt-3">
                      {(['dividerTop', 'dividerBottom'] as const).map((key) => <label key={key} className="grid gap-1 text-xs">{t(`sectionSettings.${key}`)}<select className="min-h-10 rounded-sm border border-border px-2" value={section.settings[key]} onChange={(event) => setPage((current) => ({ ...current, sections: current.sections.map((item, at) => at === index ? { ...item, settings: { ...item.settings, [key]: event.target.value as 'none' | 'curve' | 'wave' } } : item) }))}><option value="none">{t('sectionSettings.none')}</option><option value="curve">{t('sectionSettings.curve')}</option><option value="wave">{t('sectionSettings.wave')}</option></select></label>)}
                      <label className="grid gap-1 text-xs">{t('sectionSettings.reveal')}<select className="min-h-10 rounded-sm border border-border px-2" value={section.settings.reveal} onChange={(event) => setPage((current) => ({ ...current, sections: current.sections.map((item, at) => at === index ? { ...item, settings: { ...item.settings, reveal: event.target.value as 'none' | 'fadeUp' } } : item) }))}><option value="none">{t('sectionSettings.none')}</option><option value="fadeUp">{t('sectionSettings.fadeUp')}</option></select></label>
                    </div>
                  </details>
                  <Button
                    variant="secondary"
                    disabled={pending || index === page.sections.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={t('moveDown')}
                  >
                    {t('moveDown')}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={() => updateSection(index, { visible: !section.visible })}
                  >
                    {t(section.visible ? 'hideSection' : 'showSection')}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() =>
                      setPage((current) => ({
                        ...current,
                        sections: current.sections.filter((_, at) => at !== index),
                      }))
                    }
                  >
                    {t('removeSection')}
                  </Button>
                </div>
              </article>
            ))}
            <details className="rounded-sm border border-border p-3"><summary className="cursor-pointer font-semibold">{t('addSection')}</summary><div className="pt-3"><SectionPalette disabled={pending} onAdd={(type) => setPage((current) => ({ ...current, sections: [...current.sections, newSection(type)] }))} /></div></details>
          </aside>
          <div className="grid content-start gap-3"><label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={previewInteractions} onChange={(event) => setPreviewInteractions(event.target.checked)} />{i18n.getFixedT(i18n.language, 'sections')('enableInteractions')}</label><CoursePagePreview course={{ ...course, pageConfig: page }} mode={previewInteractions ? 'preview' : 'builder'} /></div>
        </div>
      )}
      {message && (
        <p role="alert" className="text-sm text-danger">
          {message}
          {message === t('pendingAssistantRevision') && revisions.data?.find((item) => item.status === 'pending_review') && <Link className="ms-2 underline" to={`/admin/review/${revisions.data.find((item) => item.status === 'pending_review')!.id}`}>{t('reviewSubmission')}</Link>}
        </p>
      )}
      {readiness.errors.length > 0 && (
        <div className="grid gap-2 text-sm text-warning">
          {t('readinessErrors', { count: readiness.errors.length })}
          {readiness.errors.map((issue) => <p key={issue.path}>{t('readinessItem', { field: issue.path })} <Link className="underline" to={`/${area}/courses/${course.id}/edit#${issue.path.split('.')[0]}`}>{t('goTo')}</Link></p>)}
        </div>
      )}
      {message === t('publishSuccess') && <p role="status" className="text-sm"><a className="underline" href={`/${i18n.language}/courses/${course.details.slug}`} target="_blank" rel="noreferrer">{t('viewLive')}</a></p>}
      <Modal open={blocker.state === 'blocked'} onOpenChange={(open) => { if (!open && blocker.state === 'blocked') blocker.reset?.(); }} title={t('discard')} description={t('discardChangesPrompt')} footer={<><Button variant="secondary" onClick={() => blocker.reset?.()}>{t('cancel')}</Button><Button variant="danger" onClick={() => blocker.proceed?.()}>{t('discard')}</Button></>} />
      <div className="fixed inset-x-0 bottom-16 z-30 flex gap-2 border-t border-border bg-surface/95 p-3 shadow-elevated backdrop-blur lg:hidden">
        <Button variant="secondary" className="flex-1" disabled={save.isPending || pending || editableRevision.isLoading} onClick={() => void save.mutateAsync()}>{t('saveDraft')}</Button>
        {user?.role === 'admin' ? <Button className="flex-1" disabled={pending || editableRevision.isLoading} onClick={() => void publish()}>{t(course.status === 'published' ? 'publishChanges' : 'publish')}</Button> : <Button className="flex-1" disabled={pending || editableRevision.isLoading} onClick={() => void submit()}>{t('submitReview')}</Button>}
      </div>
    </section>
  );
}
