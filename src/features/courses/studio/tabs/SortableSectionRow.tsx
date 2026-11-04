import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { Section } from '@/schemas/sections';
import type { TFunction } from 'i18next';

export function SortableSectionRow({
  section,
  index,
  label,
  selected,
  onSelect,
  onMove,
  onToggle,
  onDuplicate,
  onDelete,
  issueCount = 0,
  highlighted = false,
  t,
}: {
  section: Section;
  index: number;
  label: string;
  selected: boolean;
  onSelect: () => void;
  onMove: (direction: -1 | 1) => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  issueCount?: number;
  highlighted?: boolean;
  t: TFunction<'courses'>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  return <li id={`section-row-${section.id}`} ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`rounded-sm border bg-surface ${highlighted ? 'ring-2 ring-success' : ''} ${selected ? 'border-primary shadow-xs' : 'border-border'} ${isDragging ? 'z-10 opacity-60' : ''}`}>
    <div className="flex min-w-0 flex-wrap items-center gap-1 p-2">
      <button type="button" aria-label={t('builder.dragSection', { title: label })} className="grid size-9 shrink-0 touch-none place-items-center rounded-xs text-muted hover:bg-canvas" {...attributes} {...listeners}><GripVertical size={17} /></button>
      <button type="button" aria-pressed={selected} onClick={onSelect} className="min-h-10 min-w-0 flex-1 basis-36 text-start"><span className="flex items-center gap-2 truncate text-sm font-semibold">{index + 1}. {label}{issueCount > 0 && <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] text-white">{issueCount}</span>}</span><span className="block text-xs text-muted">{t(`sectionTypes.${section.type}`)}</span></button>
      <button type="button" aria-label={t('builder.editSection')} onClick={onSelect} className="grid size-9 shrink-0 place-items-center rounded-xs bg-primary text-white hover:bg-primary-strong"><Pencil size={15} /></button>
      <div className="flex min-w-0 flex-wrap items-center">
        <button type="button" aria-label={t('moveUp')} disabled={index === 0} onClick={() => onMove(-1)} className="grid size-8 place-items-center rounded-xs hover:bg-canvas disabled:opacity-40"><ChevronUp size={16} /></button>
        <button type="button" aria-label={t('moveDown')} onClick={() => onMove(1)} className="grid size-8 place-items-center rounded-xs hover:bg-canvas"><ChevronDown size={16} /></button>
        <button type="button" aria-label={section.visible ? t('hideSection') : t('showSection')} onClick={onToggle} className="grid size-8 place-items-center rounded-xs hover:bg-canvas">{section.visible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
        <button type="button" aria-label={t('builder.duplicate')} onClick={onDuplicate} className="grid size-8 place-items-center rounded-xs hover:bg-canvas"><Copy size={16} /></button>
        <button type="button" aria-label={t('removeSection')} onClick={onDelete} className="grid size-8 place-items-center rounded-xs text-danger hover:bg-danger/10"><Trash2 size={16} /></button>
      </div>
    </div>
  </li>;
}
