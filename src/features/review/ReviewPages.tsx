import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Overlay';
import { Textarea } from '@/components/ui/fields';
import { ErrorState, Skeleton, useToast } from '@/components/ui/feedback';
import { coursesService } from '@/services/courses';
import { CoursePagePreview } from '@/features/courses/CoursePagePreview';
import { ReadinessPanel } from '@/features/courses/studio/ReadinessPanel';
import { checkReadiness } from '@/schemas/courseReadiness';
import { canonicalJsonStringify } from '@/services/courses/hash';
import type { Snapshot } from '@/schemas/course';

function changedGroups(live: Snapshot | null, draft: Snapshot): string[] {
  if (!live) return ['كورس جديد'];
  return [
    ['التفاصيل', live.details, draft.details],
    ['أقسام الصفحة', live.page, draft.page],
    ['نموذج التسجيل', live.form, draft.form],
    ['تحسين محركات البحث', live.seo, draft.seo],
  ].filter(([, before, after]) => canonicalJsonStringify(before) !== canonicalJsonStringify(after)).map(([label]) => label as string);
}

export function ReviewDetailPage() {
  const { revisionId = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const toast = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [attentionOpen, setAttentionOpen] = useState(false);
  const [approveDeletionOpen, setApproveDeletionOpen] = useState(false);
  const query = useQuery({ queryKey: ['review-course', revisionId], queryFn: async () => {
    const result = await coursesService.get(revisionId);
    if (!result.ok) throw new Error(result.message);
    return result.data;
  } });
  if (query.isLoading) return <Skeleton variant="card" />;
  if (query.isError || !query.data) return <ErrorState title="ما قدرناش نحمّل طلب المراجعة" onRetry={() => void query.refetch()} />;
  const course = query.data;
  const isDeletionRequest = Boolean(course.deletionRequest);
  const readiness = checkReadiness(course.draft, course.slug);
  const changes = changedGroups(course.published, course.draft);
  const act = async (kind: 'approve' | 'reject') => {
    const result = kind === 'approve'
      ? await coursesService.approve(course.id, course.version)
      : await coursesService.reject(course.id, reason, course.version);
    if (!result.ok) {
      if (result.code === 'READINESS_FAILED') setAttentionOpen(true);
      else toast.notify({ title: result.message, tone: 'danger' });
      return;
    }
    await Promise.all([
      client.invalidateQueries({ queryKey: ['review-queue-v2'] }),
      client.invalidateQueries({ queryKey: ['courses-list'] }),
      client.invalidateQueries({ queryKey: ['notifications'] }),
      client.invalidateQueries({ queryKey: ['unread-notifications'] }),
    ]);
    toast.notify({ title: kind === 'approve' ? 'تم اعتماد الكورس ونشره.' : 'تم رفض الطلب وإرسال السبب للمساعد.', tone: 'success' });
    navigate('/admin/review');
  };
  const actOnDeletion = async (kind: 'approve' | 'reject') => {
    const result = kind === 'approve'
      ? await coursesService.approveDeletion(course.id)
      : await coursesService.rejectDeletion(course.id, reason);
    if (!result.ok) {
      toast.notify({ title: result.message, tone: 'danger' });
      return;
    }
    await Promise.all([
      client.invalidateQueries({ queryKey: ['review-queue-v2'] }),
      client.invalidateQueries({ queryKey: ['courses-list'] }),
      client.invalidateQueries({ queryKey: ['notifications'] }),
      client.invalidateQueries({ queryKey: ['unread-notifications'] }),
    ]);
    toast.notify({ title: kind === 'approve' ? 'تم حذف الكورس وإخفاؤه من الموقع.' : 'تم رفض طلب الحذف وإرسال السبب للمساعد.', tone: 'success' });
    navigate('/admin/review');
  };
  const goToIssue = (issue: (typeof readiness.errors)[number]) => {
    setAttentionOpen(false);
    const target = issue.sectionId
      ? `/admin/courses/${course.id}/studio/page/${issue.sectionId}`
      : `/admin/courses/${course.id}/studio/${issue.tab}`;
    navigate(target);
  };
  return <section className="grid gap-5">
    <header><Link className="text-sm text-primary-strong underline" to="/admin/review">العودة لطلبات المراجعة</Link><h1 className="mt-2 text-2xl font-bold">{course.draft.details.title.ar || course.slug}</h1><p className="text-sm text-muted">{isDeletionRequest ? 'راجع سبب الطلب وحالة الكورس قبل اتخاذ القرار.' : 'قارن النسخة المنشورة بالتعديلات المقترحة.'}</p></header>
    {isDeletionRequest && course.deletionRequest && <section className="grid gap-2 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950"><h2 className="font-bold">طلب حذف الكورس</h2><p>سبب الطلب: {course.deletionRequest.reason}</p><p>مقدم الطلب: {course.deletionRequest.requestedBy}</p><p>حالة الكورس: {course.status === 'published' ? 'منشور' : course.status === 'archived' ? 'مؤرشف' : 'مسودة'}</p>{course.status === 'published' && <p>الكورس هيفضل منشور لحد اعتماد طلب الحذف.</p>}</section>}
    <section className="grid gap-2 rounded-md border border-border bg-surface p-4"><h2 className="font-bold">التغييرات</h2>{changes.length ? <ul className="list-inside list-disc text-sm">{changes.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="text-sm text-muted">مفيش اختلافات بين النسختين.</p>}</section>
    <div className="grid gap-4 xl:grid-cols-2"><section className="grid content-start gap-2"><h2 className="font-bold">النسخة المنشورة</h2>{course.published ? <CoursePagePreview course={course} snapshot={course.published} /> : <p className="rounded border border-border p-4 text-sm text-muted">الكورس ده لسه ما اتنشرش.</p>}</section><section className="grid content-start gap-2"><h2 className="font-bold">التعديلات المقترحة</h2><CoursePagePreview course={course} snapshot={course.draft} /></section></div>
    {isDeletionRequest ? <footer className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button variant="secondary" onClick={() => { setReason(''); setRejectOpen(true); }}>ارفض طلب الحذف</Button><Button variant="danger" onClick={() => setApproveDeletionOpen(true)}>اعتمد الحذف</Button></footer> : course.review.state === 'pending' && <footer className="flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button variant="secondary" onClick={() => setRejectOpen(true)}>ارفض</Button><Button onClick={() => readiness.errors.length ? setAttentionOpen(true) : void act('approve')}>اعتمد وانشر</Button></footer>}
    {rejectOpen && <Modal open onOpenChange={setRejectOpen} title={isDeletionRequest ? 'ارفض طلب الحذف' : 'ارفض طلب المراجعة'} description={isDeletionRequest ? 'اكتب سبب واضح للمساعد.' : 'اكتب سبب واضح للمساعد عشان يقدر يعدّل نفس الكورس.'} footer={<><Button variant="secondary" onClick={() => setRejectOpen(false)}>إلغاء</Button><Button variant="danger" disabled={reason.trim().length < 10 || reason.trim().length > 1000} onClick={() => void (isDeletionRequest ? actOnDeletion('reject') : act('reject'))}>تأكيد الرفض</Button></>}><label className="grid gap-2 text-sm font-semibold">سبب الرفض<Textarea rows={5} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></label><p className="text-end text-xs text-muted">{reason.length}/1000</p></Modal>}
    {!isDeletionRequest && attentionOpen && <ReadinessPanel issues={readiness.errors} sections={course.draft.page.sections} onClose={() => setAttentionOpen(false)} onGo={goToIssue} />}
    <ConfirmDialog open={approveDeletionOpen} onOpenChange={setApproveDeletionOpen} title="اعتماد حذف الكورس؟" description="هيتخفى الكورس من القوائم والموقع، وهيتقفل التسجيل. بيانات التسجيلات والسجلات هتفضل محفوظة والرابط هيفضل محجوز." confirmLabel="اعتمد الحذف" cancelLabel="إلغاء" onConfirm={() => { setApproveDeletionOpen(false); void actOnDeletion('approve'); }} />
  </section>;
}
