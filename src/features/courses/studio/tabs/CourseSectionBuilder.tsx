import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowRight, Layers, Redo2, Save, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Section, SectionType } from '@/schemas/sections';
import { SectionSchema, SECTION_REGISTRY_META } from '@/schemas/sections';
import type { Course, Snapshot } from '@/schemas/course';
import { Button } from '@/components/ui/Button';
import { CoursePagePreview } from '../../CoursePagePreview';
import { EDITABLE_SECTION_TYPES, hasSectionEditor } from '../editableSections';
import { SectionPropertiesPanel } from './SectionPropertiesPanel';
import { SortableSectionRow } from './SortableSectionRow';
import { useLanguage, getBilingualText } from '@/i18n/useLanguage';
import { checkReadiness } from '@/schemas/courseReadiness';

const emptyText = () => ({ ar: '', en: '' });
const deviceWidths = [1200, 768, 375] as const;
type DeviceWidth = (typeof deviceWidths)[number];

function reorderedWithHiddenSections(all: Section[], editable: Section[]): Section[] {
  const iterator = editable[Symbol.iterator]();
  const replaced = all.flatMap((section) => {
    if (!hasSectionEditor(section.type)) return [section];
    const next = iterator.next();
    return next.done ? [] : [next.value];
  });
  while (true) {
    const next = iterator.next();
    if (next.done) break;
    replaced.push(next.value);
  }
  return replaced;
}

function makeSection(type: SectionType): Section {
  return SectionSchema.parse({
    id: crypto.randomUUID(),
    type,
    visible: true,
    settings: { background: 'none', spacing: 'lg', width: 'contained', align: 'start', dividerTop: 'none', dividerBottom: 'none', reveal: 'none' },
    content: SECTION_REGISTRY_META[type].defaultContent(),
  }) as Section;
}

export function CourseSectionBuilder({
  course,
  snapshot,
  onChange,
  sectionId,
  basePath,
  onSave,
  onPrimaryAction,
}: {
  course: Course;
  snapshot: Snapshot;
  onChange: (snapshot: Snapshot) => void;
  sectionId?: string;
  basePath: string;
  onSave: () => Promise<boolean>;
  onPrimaryAction: () => void;
}) {
  const { t } = useTranslation('courses');
  const { language } = useLanguage();
  const navigate = useNavigate();
  const sections = useMemo(() => snapshot.page.sections.filter((section) => hasSectionEditor(section.type)), [snapshot.page.sections]);
  const previous = useRef<Section[]>(sections);
  const baseline = useRef<{ id: string | undefined; section: Section | undefined }>({ id: undefined, section: undefined });
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [past, setPast] = useState<Section[][]>([]);
  const [future, setFuture] = useState<Section[][]>([]);
  const [device, setDevice] = useState<DeviceWidth>(1200);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const selected = sections.find((section) => section.id === sectionId) ?? null;

  useEffect(() => {
    if (baseline.current.id === sectionId) return;
    baseline.current = { id: sectionId, section: snapshot.page.sections.find((section) => section.id === sectionId) };
  }, [sectionId, snapshot.page.sections]);

  useEffect(() => {
    previous.current = sections;
  }, [sections]);

  useEffect(() => {
    if (sectionId) return;
    const id = sessionStorage.getItem(`course-section-highlight:${course.id}`);
    if (!id) return;
    sessionStorage.removeItem(`course-section-highlight:${course.id}`);
    setHighlightId(id);
    window.setTimeout(() => {
      document.getElementById(`section-row-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => setHighlightId(null), 1800);
    }, 50);
  }, [sectionId, course.id]);

  const commit = (next: Section[], remember = true) => {
    if (remember) {
      setPast((items) => [...items.slice(-49), previous.current]);
      setFuture([]);
    }
    previous.current = next;
    onChange({ ...snapshot, page: { ...snapshot.page, sections: reorderedWithHiddenSections(snapshot.page.sections, next) } });
  };

  const update = (id: string, replacement: Section) => commit(sections.map((section) => section.id === id ? replacement : section));
  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    commit(arrayMove(sections, index, target));
  };
  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = sections.findIndex((section) => section.id === active.id);
    const to = sections.findIndex((section) => section.id === over.id);
    if (from >= 0 && to >= 0) commit(arrayMove(sections, from, to));
  };
  const add = (type: SectionType) => {
    const section = makeSection(type);
    commit([...sections, section]);
    setPaletteOpen(false);
    navigate(`${basePath}/${section.id}`);
  };
  const duplicate = (section: Section) => {
    const index = sections.findIndex((item) => item.id === section.id);
    const copy = SectionSchema.parse({ ...JSON.parse(JSON.stringify(section)), id: crypto.randomUUID() }) as Section;
    const next = [...sections.slice(0, index + 1), copy, ...sections.slice(index + 1)];
    commit(next);
    navigate(`${basePath}/${copy.id}`);
  };
  const remove = (section: Section) => {
    const next = sections.filter((item) => item.id !== section.id);
    commit(next);
    if (sectionId === section.id) navigate(basePath);
  };
  const undo = () => {
    const prior = past.at(-1);
    if (!prior) return;
    setPast((items) => items.slice(0, -1));
    setFuture((items) => [previous.current, ...items]);
    commit(prior, false);
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setFuture((items) => items.slice(1));
    setPast((items) => [...items, previous.current]);
    commit(next, false);
  };
  const previewSnapshot = { ...snapshot, page: { ...snapshot.page, sections } };
  const titleFor = (section: Section) => {
    const content = section.content as { title?: { ar: string; en: string }; eyebrow?: { ar: string; en: string }; question?: { ar: string; en: string } };
    return getBilingualText(content.title ?? content.eyebrow ?? content.question ?? emptyText(), language) || t(`sectionTypes.${section.type}`);
  };

  const openFullPreview = () => {
    const key = crypto.randomUUID();
    sessionStorage.setItem(`course-preview:${key}`, JSON.stringify(snapshot));
    const role = basePath.split('/')[1];
    window.open(`/${role}/courses/${course.id}/preview?workingCopy=${key}`, '_blank', 'noopener,noreferrer');
  };
  const confirmDelete = (section: Section) => {
    if (window.confirm(t('builder.confirmDeleteSection', { title: titleFor(section) }))) remove(section);
  };
  const saveAndReturn = useCallback(async (openNext = false) => {
    if (!selected) return;
    const currentIndex = sections.findIndex((section) => section.id === selected.id);
    if (!(await onSave())) return;
    if (openNext) {
      const nextSection = sections[currentIndex + 1];
      navigate(nextSection ? `${basePath}/${nextSection.id}` : basePath);
    } else {
      sessionStorage.setItem(`course-section-highlight:${course.id}`, selected.id);
      navigate(basePath);
    }
  }, [selected, sections, onSave, basePath, navigate, course.id]);
  const cancelEdit = useCallback(() => {
    if (!selected) return;
    const original = baseline.current.id === selected.id ? baseline.current.section : undefined;
    const changed = original && JSON.stringify(original) !== JSON.stringify(selected);
    if (!changed || window.confirm(t('builder.discardSectionPrompt'))) {
      if (changed && original) onChange({ ...snapshot, page: { ...snapshot.page, sections: snapshot.page.sections.map((section) => section.id === selected.id ? original : section) } });
      navigate(basePath);
    }
  }, [selected, snapshot, onChange, t, navigate, basePath]);
  const issueCount = (section: Section) => {
    return checkReadiness(snapshot, course.slug).errors.filter((issue) => issue.sectionId === section.id).length;
  };
  useEffect(() => {
    if (!sectionId) return;
    const currentPath = `${basePath}/${sectionId}`;
    const onPopState = () => {
      const original = baseline.current.id === selected?.id ? baseline.current.section : undefined;
      if (selected && original && JSON.stringify(original) !== JSON.stringify(selected) && !window.confirm(t('builder.discardSectionPrompt'))) {
        navigate(currentPath, { replace: true });
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelEdit();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveAndReturn();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPopState);
    };
  }, [sectionId, selected, basePath, navigate, t, cancelEdit, saveAndReturn]);

  const editing = Boolean(sectionId);
  const sectionPreview = selected ? { ...snapshot, page: { ...snapshot.page, sections: [selected] } } : previewSnapshot;
  const actions = <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={cancelEdit}>{t('builder.cancel')}</Button><Button variant="primary" onClick={() => void saveAndReturn()}><Save size={15} />{t('builder.saveSection')}</Button><Button variant="secondary" onClick={() => void saveAndReturn(true)}>{t('builder.saveAndNext')}</Button></div>;

  if (!editing) return <div className="grid gap-5">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-3">
      <div><h2 className="font-bold">{t('builder.sectionOutline')}</h2><p className="text-xs text-muted">{t('builder.description')}</p></div>
      <div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" disabled={!past.length} aria-label={t('builder.undo')} onClick={undo}><Undo2 size={15} />{t('builder.undo')}</Button><Button variant="outline" size="sm" disabled={!future.length} aria-label={t('builder.redo')} onClick={redo}><Redo2 size={15} />{t('builder.redo')}</Button><Button variant="secondary" onClick={openFullPreview}>{t('builder.fullPreview')}</Button><Button onClick={() => setPaletteOpen((open) => !open)}>{t('builder.addSection')}</Button></div>
    </header>
    {sections.length === 0 ? <div className="grid gap-3 rounded-md border border-dashed border-border bg-surface p-8 text-center"><Layers className="mx-auto text-muted" /><p className="font-semibold">{t('builder.emptySections')}</p><Button className="mx-auto" onClick={() => setPaletteOpen(true)}>{t('builder.addFirst')}</Button></div> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}><ul className="grid gap-2">{sections.map((section, index) => <SortableSectionRow key={section.id} section={section} index={index} label={titleFor(section)} selected={false} highlighted={highlightId === section.id} issueCount={issueCount(section)} onSelect={() => navigate(`${basePath}/${section.id}`)} onMove={(direction) => move(index, direction)} onToggle={() => update(section.id, { ...section, visible: !section.visible } as Section)} onDuplicate={() => duplicate(section)} onDelete={() => confirmDelete(section)} t={t} />)}</ul></SortableContext></DndContext>}
    {paletteOpen && <div className="grid gap-3 rounded-md border border-border bg-surface p-4"><h3 className="font-semibold">{t('builder.addSection')}</h3><div className="flex flex-wrap gap-2">{EDITABLE_SECTION_TYPES.map((type) => <Button key={type} variant="secondary" size="sm" onClick={() => add(type)}>{t(`sectionTypes.${type}`)}</Button>)}</div></div>}
    {sections.length > 0 && <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button variant="danger" size="sm" className="me-auto" onClick={() => { if (window.confirm(t('builder.confirmDeleteAll'))) commit([]); }}>{t('builder.deleteAll')}</Button><Button variant="outline" onClick={() => void onSave()}>{t('saveDraft')}</Button><Button onClick={onPrimaryAction}>{t('publish')}</Button></div>}
  </div>;

  if (!selected) return <div role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-5"><p>{t('builder.sectionMissing')}</p><Button className="mt-3" onClick={() => navigate(basePath)}>{t('builder.backToSections')}</Button></div>;
  return <div className="grid gap-4">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-2"><Button variant="outline" onClick={cancelEdit}><ArrowRight size={16} />{t('builder.backToSections')}</Button><h2 className="font-bold">{titleFor(selected)}</h2><span className="rounded-full bg-danger px-2 py-0.5 text-xs text-white" hidden={!issueCount(selected)}>{issueCount(selected)}</span></div>
      <div className="flex flex-wrap gap-2">{actions}<Button variant="outline" size="sm" disabled={!past.length} onClick={undo} aria-label={t('builder.undo')}><Undo2 size={15} /></Button><Button variant="outline" size="sm" disabled={!future.length} onClick={redo} aria-label={t('builder.redo')}><Redo2 size={15} /></Button></div>
    </header>
    <div role="tablist" aria-label={t('builder.mobileMode')} className="grid grid-cols-2 rounded-sm bg-surface p-1 md:hidden">{(['edit', 'preview'] as const).map((pane) => <button key={pane} type="button" role="tab" aria-selected={mobilePane === pane} onClick={() => setMobilePane(pane)} className={`min-h-10 rounded-xs text-sm ${mobilePane === pane ? 'bg-primary text-white' : 'text-muted'}`}>{t(`builder.${pane === 'edit' ? 'editMode' : 'previewMode'}`)}</button>)}</div>
    <div className="grid min-w-0 gap-4 md:grid-cols-2 md:items-start">
      <div className={`${mobilePane === 'edit' ? 'grid' : 'hidden'} min-w-0 gap-4 md:grid md:max-h-[calc(100dvh-18rem)] md:overflow-y-auto md:pe-1`}><SectionPropertiesPanel section={selected} onChange={(section) => update(selected.id, section)} /><div className="flex flex-wrap gap-2 pb-4">{actions}</div></div>
      <section className={`${mobilePane === 'preview' ? 'grid' : 'hidden'} min-w-0 content-start gap-3 md:grid md:max-h-[calc(100dvh-18rem)] md:overflow-auto`} aria-label={t('builder.preview')}>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border bg-surface p-2"><h3 className="font-semibold">{t('builder.singleSectionPreview')}</h3><div role="group" aria-label={t('builder.previewSize')} className="flex rounded-sm border border-border p-0.5">{deviceWidths.map((width) => <button key={width} type="button" aria-pressed={device === width} onClick={() => setDevice(width)} className={`min-h-8 rounded-xs px-2 text-xs ${device === width ? 'bg-primary text-white' : 'text-muted'}`}>{width}</button>)}</div></div>
        <div className="overflow-auto rounded-sm border border-border bg-canvas p-2"><div style={{ width: device, minWidth: device }} className="mx-auto overflow-hidden rounded-sm bg-surface shadow-xs"><CoursePagePreview course={course} snapshot={sectionPreview} mode="builder" /></div></div>
      </section>
    </div>
  </div>;
}


