import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Button } from '@/components/ui/Button';
import { coursesService } from '@/services/courses';
import { formatDate } from '@/lib/formatters';

type QueueTab = 'submissions' | 'deletions';

export default function ReviewQueuePage() {
  const [tab, setTab] = useState<QueueTab>('submissions');
  const query = useQuery({
    queryKey: ['review-queue-v2'],
    queryFn: async () => {
      const [submissions, deletions] = await Promise.all([
        coursesService.listPendingReview(),
        coursesService.listPendingDeletion(),
      ]);
      if (!submissions.ok) throw new Error(submissions.message);
      if (!deletions.ok) throw new Error(deletions.message);
      return { submissions: submissions.data, deletions: deletions.data };
    },
  });
  if (query.isLoading) return <Skeleton variant="card" />;
  if (query.isError) return <ErrorState title="ما قدرناش نحمّل طلبات المراجعة" onRetry={() => void query.refetch()} />;
  const data = query.data;
  if (!data) return <Skeleton variant="card" />;
  const rows = tab === 'submissions' ? data.submissions : data.deletions;
  return <section className="grid gap-4">
    <header><h1 className="text-2xl font-bold">طلبات المراجعة</h1><p className="text-sm text-muted">راجع التعديلات وطلبات الحذف قبل اتخاذ القرار.</p></header>
    <div role="tablist" aria-label="نوع الطلبات" className="flex flex-wrap gap-2">
      <Button role="tab" aria-selected={tab === 'submissions'} variant={tab === 'submissions' ? 'primary' : 'secondary'} onClick={() => setTab('submissions')}>طلبات النشر ({data.submissions.length})</Button>
      <Button role="tab" aria-selected={tab === 'deletions'} variant={tab === 'deletions' ? 'primary' : 'secondary'} onClick={() => setTab('deletions')}>طلبات الحذف ({data.deletions.length})</Button>
    </div>
    {rows.length ? <div className="grid gap-3">{rows.map((course) => {
      const request = course.deletionRequest;
      return <Link key={`${tab}-${course.id}`} to={`/admin/review/${course.id}`} className="grid gap-2 rounded-md border border-border bg-surface p-4 hover:border-primary sm:grid-cols-[1fr_auto]">
        <span className="grid gap-1 font-semibold">
          {course.draft.details.title.ar || course.slug}
          {tab === 'submissions' ? <>
            <small className="font-normal text-muted">اتبعت للمراجعة · {formatDate(course.review.submittedAt ?? course.updatedAt)}</small>
            <small className="font-normal text-muted">{course.published ? 'تعديل على كورس منشور' : 'كورس جديد'}</small>
          </> : <>
            <small className="font-normal text-amber-900">سبب الطلب: {request?.reason}</small>
            <small className="font-normal text-muted">مقدم الطلب: {request?.requestedBy} · الحالة الحالية: {course.status === 'published' ? 'منشور' : course.status === 'archived' ? 'مؤرشف' : 'مسودة'}</small>
            <small className="font-normal text-muted">وصل الطلب · {formatDate(request?.requestedAt ?? course.updatedAt)}</small>
          </>}
        </span>
        <span className="self-center rounded-pill bg-amber-50 px-3 py-1 text-sm text-amber-900">{tab === 'submissions' ? 'في انتظار المراجعة' : 'طلب حذف في انتظار الموافقة'}</span>
      </Link>;
    })}</div> : <EmptyState title={tab === 'submissions' ? 'مفيش طلبات مراجعة دلوقتي' : 'مفيش طلبات حذف دلوقتي'} description={tab === 'submissions' ? 'أي كورس يتبعت للمراجعة هيظهر هنا.' : 'طلبات الحذف الجديدة هتظهر هنا مع سبب الطلب وحالة الكورس.'} />}
  </section>;
}
