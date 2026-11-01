import { useEffect, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/fields';
import { Checkbox } from '@/components/ui/selection';
import { adminService } from '@/services/admin.mock';
import type { Snapshot } from '@/schemas/course';
import type { Course } from '@/schemas/course';
import type { RegistrationField } from '@/schemas/registrationForm';
import { SectionSchema, SECTION_REGISTRY_META } from '@/schemas/sections';
import { CoursePagePreview } from '@/features/courses/CoursePagePreview';
import { createRegistrationFieldId, createRegistrationOptionId, moveRegistrationField } from '@/lib/registrationFormEditor';

function OptionEditor({ field, index, update }: { field: RegistrationField; index: number; update: (field: RegistrationField) => void }) {
  const options = field.options ?? [];
  const setLabel = (index: number, ar: string) => update({ ...field, options: options.map((option, at) => at === index ? { ...option, label: { ...option.label, ar, en: '' } } : option) });
  return <fieldset data-readiness-path={`form.fields.${index}.options`} className="grid gap-2 rounded-xs border border-border p-3"><legend className="px-1 text-sm font-semibold">الاختيارات</legend>{options.map((option, index) => <div key={option.value} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2"><Input value={option.label.ar} onChange={(e) => setLabel(index, e.target.value)} aria-label={`الاختيار ${index + 1}`} /><Button variant="ghost" size="sm" disabled={index === 0} aria-label="حرّك الاختيار لأعلى" onClick={() => update({ ...field, options: arrayMove(options, index, index - 1) })}><ArrowUp size={16}/></Button><Button variant="ghost" size="sm" disabled={index === options.length - 1} aria-label="حرّك الاختيار لأسفل" onClick={() => update({ ...field, options: arrayMove(options, index, index + 1) })}><ArrowDown size={16}/></Button><Button variant="danger" size="sm" aria-label="احذف الاختيار" onClick={() => update({ ...field, options: options.filter((_, at) => at !== index) })}><Trash2 size={16}/></Button></div>)}<Button variant="secondary" onClick={() => update({ ...field, options: [...options, { value: createRegistrationOptionId(), label: { ar: '', en: '' } }] })}><Plus size={15}/>أضف اختيارًا</Button></fieldset>;
}
function FieldCard({ field, index, total, onUpdate, onMove, onDuplicate, onDelete }: { field: RegistrationField; index: number; total: number; onUpdate: (field: RegistrationField) => void; onMove: (delta: -1|1) => void; onDuplicate: () => void; onDelete: () => void }) {
  const sortable = useSortable({ id: field.id });
  return <fieldset ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }} className="grid gap-3 rounded-sm border border-border bg-surface p-3" {...sortable.attributes}>
    <legend className="px-1 font-semibold">حقل {index + 1}</legend>
    <div className="flex flex-wrap items-center gap-1"><button type="button" {...sortable.listeners} className="grid size-10 place-items-center rounded-xs border border-border" aria-label="اسحب لإعادة الترتيب"><GripVertical size={17}/></button><Button variant="ghost" size="sm" disabled={index===0} onClick={() => onMove(-1)} aria-label="حرّك الحقل لأعلى"><ArrowUp size={16}/></Button><Button variant="ghost" size="sm" disabled={index===total-1} onClick={() => onMove(1)} aria-label="حرّك الحقل لأسفل"><ArrowDown size={16}/></Button><Button variant="outline" size="sm" onClick={onDuplicate}><Copy size={14}/>كرّر</Button><Button variant="danger" size="sm" onClick={onDelete}><Trash2 size={14}/>احذف</Button></div>
    <label className="grid gap-1 text-sm">نوع الحقل<select className="min-h-11 rounded-xs border border-border bg-surface px-3" value={field.type} onChange={(e) => { const type = e.target.value as RegistrationField['type']; onUpdate({ ...field, type, options: ['select','radio'].includes(type) ? (field.options?.length ? field.options : [{ value:createRegistrationOptionId(), label:{ ar:'',en:'' } },{ value:createRegistrationOptionId(), label:{ ar:'',en:'' } }]) : undefined }); }}><option value="text">نص قصير</option><option value="textarea">نص طويل</option><option value="select">قائمة اختيار</option><option value="radio">اختيار واحد</option><option value="checkbox">مربع اختيار</option></select></label>
    <label data-readiness-path={`form.fields.${index}.label.ar`} className="grid gap-1 text-sm">عنوان الحقل <span className="text-danger">مطلوب</span><Input required value={field.label.ar} onChange={(e) => onUpdate({ ...field, label: { ...field.label, ar: e.target.value, en: '' } })} /></label>
    <label className="grid gap-1 text-sm">نص توضيحي داخل الحقل<Input value={field.placeholder?.ar ?? ''} onChange={(e) => onUpdate({ ...field, placeholder: { ar:e.target.value,en:'' } })} /></label>
    <label className="grid gap-1 text-sm">مساعدة إضافية<Textarea rows={2} value={field.helpText?.ar ?? ''} onChange={(e) => onUpdate({ ...field, helpText: { ar:e.target.value,en:'' } })} /></label>
    <label className="flex min-h-10 items-center gap-2 text-sm"><Checkbox checked={field.required} onCheckedChange={(checked) => onUpdate({ ...field, required: checked === true })}/>إجابة مطلوبة</label>
    {['select','radio'].includes(field.type) && <OptionEditor field={field} index={index} update={onUpdate} />}
    <p className="text-xs text-muted">معرّف الحقل: <bdi dir="ltr">{field.id}</bdi></p>
  </fieldset>;
}
export function CourseFormTab({ course, snapshot, onChange }: { course: Course; snapshot: Snapshot; onChange: (value: Snapshot) => void }) {
  const [privacyUrl, setPrivacyUrl] = useState('');
  const [consentText, setConsentText] = useState(snapshot.form.consentText?.ar ?? 'أوافق على سياسة الخصوصية.');
  const fields = snapshot.form.fields;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  useEffect(() => { void adminService.publicSettings().then((settings) => { const registration = settings.values.registration as { privacyUrl?: string } | undefined; setPrivacyUrl(registration?.privacyUrl ?? ''); }).catch(() => setPrivacyUrl('')); }, []);
  useEffect(() => { setConsentText(snapshot.form.consentText?.ar ?? 'أوافق على سياسة الخصوصية.'); }, [snapshot.form.consentText?.ar]);
  const updateFields = (next: RegistrationField[]) => onChange({ ...snapshot, form: { ...snapshot.form, fields: next } });
  const updateField = (index: number, field: RegistrationField) => updateFields(fields.map((current, at) => at === index ? field : current));
  const dragEnd = (event: DragEndEvent) => { if (!event.over || event.active.id === event.over.id) return; const from = fields.findIndex((field) => field.id === event.active.id); const to = fields.findIndex((field) => field.id === event.over?.id); if (from >= 0 && to >= 0) updateFields(moveRegistrationField(fields, from, to)); };
  const add = () => { if (fields.length >= 12) return; updateFields([...fields, { id: createRegistrationFieldId(), type: 'text', label: { ar:'',en:'' }, required:false }]); };
  const duplicate = (index: number) => { if (fields.length >= 12) return; const copy = structuredClone(fields[index]!); copy.id = createRegistrationFieldId(); if (copy.options) copy.options = copy.options.map((option) => ({ ...option, value: createRegistrationOptionId() })); updateFields([...fields.slice(0,index+1), copy, ...fields.slice(index+1)]); };
  const registrationSection = snapshot.page.sections.find((section) => section.type === 'registrationForm') ?? SectionSchema.parse({ id: crypto.randomUUID(), type: 'registrationForm', visible: true, content: SECTION_REGISTRY_META.registrationForm.defaultContent() });
  const formPreviewSnapshot = { ...snapshot, page: { ...snapshot.page, sections: [registrationSection] } };
  return <div className="grid gap-5">
    <section className="grid gap-3 rounded-md border border-border bg-surface p-4"><h2 className="text-xl font-bold">نموذج التسجيل</h2><p className="text-sm text-muted">الحقول الأساسية موجودة دائمًا ومش ممكن حذفها.</p><ul className="grid gap-2 sm:grid-cols-2">{['الاسم بالكامل','البريد الإلكتروني','رقم الهاتف','الموافقة على سياسة الخصوصية'].map((label) => <li key={label} className="rounded-xs bg-canvas p-3 text-sm">{label} <span className="text-muted">· ثابت</span></li>)}</ul>
      <label data-readiness-path="form.consentText.ar" className="grid gap-1.5 text-sm">نص الموافقة <Textarea value={consentText} onChange={(e) => { const ar=e.target.value; setConsentText(ar); onChange({ ...snapshot, form: { ...snapshot.form, consentText: { ar, en:'' } } }); }} /></label><p className="text-sm">رابط سياسة الخصوصية: {privacyUrl ? <a className="text-primary-strong underline" href={privacyUrl} target="_blank" rel="noreferrer">معاينة السياسة</a> : 'أضف الرابط من الإعدادات.'}</p></section>
    <section data-readiness-path="form.fields" className="grid gap-4 rounded-md border border-border bg-canvas p-4"><header className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-lg font-bold">الحقول الإضافية</h3><p className="text-sm text-muted">تقدر تضيف لحد 12 حقلًا، وترتيب الحقول هو ترتيب ظهورها للزوار.</p></div><Button variant="primary" disabled={fields.length>=12} onClick={add}><Plus size={16}/>أضف حقلًا</Button></header>
      {fields.length===0 ? <p className="rounded-xs border border-dashed border-border p-5 text-center text-sm text-muted">مفيش حقول إضافية. تقدر تضيف أول حقل دلوقتي.</p> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={fields.map((field)=>field.id)} strategy={verticalListSortingStrategy}><div className="grid gap-3">{fields.map((field,index)=><FieldCard key={field.id} field={field} index={index} total={fields.length} onUpdate={(next)=>updateField(index,next)} onMove={(delta)=>updateFields(moveRegistrationField(fields,index,index+delta))} onDuplicate={()=>duplicate(index)} onDelete={()=>updateFields(fields.filter((_,at)=>at!==index))}/>)}</div></SortableContext></DndContext>}
      {fields.length>=12 && <p className="text-sm text-warning">وصلت للحد الأقصى من الحقول.</p>}
    </section>
    <section className="grid gap-3 rounded-md border border-border bg-surface p-4"><h3 className="text-lg font-bold">معاينة الزائر</h3><p className="text-sm text-muted">المعاينة للعرض فقط، ومش هتُرسل أي بيانات.</p><CoursePagePreview course={course} snapshot={formPreviewSnapshot}/></section>
  </div>;
}
