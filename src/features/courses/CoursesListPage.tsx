import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/fields';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { ConfirmDialog } from '@/components/ui/Overlay';
import { coursesAdminService } from '@/services/courses.admin';
import { useNewCourseDialog } from './newCourseDialogStore';
import { CourseShareLinks } from './CourseShareLinks';
import { useToast } from '@/components/ui/feedback';
import type { CourseListItem } from '@/services/courses/types';

export default function CoursesListPage() {
  const { t } = useTranslation('courses');
  const [query, setQuery] = useState(''); const [status, setStatus] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams(); const [selected, setSelected] = useState<{ course: CourseListItem; action: 'archive'|'unarchive'|'delete' }|null>(null);
  const newCourse = useNewCourseDialog(); const toast = useToast(); const client = useQueryClient();
  const filters = useMemo(() => ({ search: query, status: status as 'all'|'draft'|'published'|'archived', pageSize: 50 }), [query,status]);
  const result = useQuery({ queryKey: ['courses-list', filters], queryFn: () => coursesAdminService.list(filters) });
  useEffect(() => { if (searchParams.get('new') === '1') { const next = new URLSearchParams(searchParams); next.delete('new'); setSearchParams(next, { replace: true }); newCourse.open(); } }, [searchParams, setSearchParams, newCourse]);
  const confirm = async () => {
    if (!selected) return;
    try {
      if (selected.action === 'archive') await coursesAdminService.archive(selected.course.id);
      else if (selected.action === 'unarchive') await coursesAdminService.unarchive(selected.course.id);
      else await coursesAdminService.remove(selected.course.id);
      await client.invalidateQueries({ queryKey: ['courses-list'] }); setSelected(null);
      toast.notify({ title: selected.action === 'delete' ? 'تم حذف الكورس' : 'تم تحديث حالة الكورس', tone: 'success' });
    } catch (error) { toast.notify({ title: error instanceof Error ? error.message : 'حصلت مشكلة، جرّب تاني.', tone: 'danger' }); }
  };
  if (result.isPending) return <div className="grid gap-3">{Array.from({length:3},(_,index)=><Skeleton key={index} variant="card"/>)}</div>;
  if (result.isError || !result.data) return <ErrorState title="حصلت مشكلة في تحميل الكورسات، جرّب تاني." onRetry={()=>void result.refetch()}/>;
  const courses = result.data.items;
  return <main className="grid gap-5"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">{t('title','الكورسات')}</h1><p className="text-sm text-muted">إدارة الكورسات وصفحاتها العامة.</p></div><Button onClick={newCourse.open}><Plus size={16}/>أنشئ كورس</Button></header>
    <div className="flex flex-wrap gap-3"><label className="relative min-w-56 flex-1"><Search size={16} className="absolute start-3 top-3 text-muted"/><Input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="ابحث باسم الكورس أو الرابط" className="ps-9"/></label><select value={status} onChange={(event)=>setStatus(event.target.value)} className="min-h-11 rounded-xs border border-border bg-surface px-3 text-sm"><option value="all">كل الحالات</option><option value="draft">مسودة</option><option value="published">منشور</option><option value="archived">مؤرشف</option></select></div>
    {courses.length ? <section className="grid gap-3">{courses.map((course)=><article key={course.id} className="grid gap-3 rounded-sm border border-border bg-surface p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-lg font-bold">{course.title.ar || course.slug}</h2><p className="text-sm text-muted">{course.category} · /{course.slug}</p><p className="mt-1 text-xs text-muted">{course.status === 'published' ? 'منشور' : course.status === 'archived' ? 'مؤرشف' : 'مسودة'}{course.hasUnpublishedChanges ? ' · فيه تعديلات غير منشورة' : ''}{course.enrollmentCount !== undefined ? ` · ${course.enrollmentCount} تسجيل` : ''}</p></div><Link className="text-sm font-semibold text-primary-strong underline" to={`/admin/courses/${course.id}/studio/page`}>افتح الاستوديو</Link></div>
      <CourseShareLinks published={course.status === 'published'} slug={course.slug} title={course.publishedTitle?.ar ?? course.title.ar} whatsappNumber={course.publishedWhatsappNumber}/>
      <div className="flex flex-wrap gap-2">{course.status === 'published' ? <Button size="sm" variant="outline" onClick={()=>setSelected({course,action:'archive'})}>أرشف</Button> : course.status === 'archived' ? <Button size="sm" variant="outline" onClick={()=>setSelected({course,action:'unarchive'})}>ألغِ الأرشفة</Button> : <Button size="sm" onClick={()=>setSelected({course,action:'archive'})}>أرشف</Button>}<Button size="sm" variant="danger" onClick={()=>setSelected({course,action:'delete'})}>احذف</Button></div></article>)}</section> : <EmptyState title="مفيش كورسات مطابقة." description="أنشئ كورس جديد أو غيّر البحث."/>}
    <ConfirmDialog open={Boolean(selected)} onOpenChange={(open)=>!open&&setSelected(null)} title={selected?.action==='delete'?'حذف الكورس؟':selected?.action==='archive'?'أرشفة الكورس؟':'إلغاء الأرشفة؟'} description={selected?.action==='delete'?`هيتخفى الكورس من الموقع والقوائم، والرابط هيفضل محجوز.${selected.course.enrollmentCount !== undefined ? ` عدد التسجيلات الحالي: ${selected.course.enrollmentCount}.` : ''}`:'هتتحدّث حالة الكورس، وتقدر تغيّرها بعدين.'} confirmLabel="تأكيد" cancelLabel="إلغاء" onConfirm={()=>void confirm()}/>
  </main>;
}

