import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { DashboardRoutePage } from '@/features/dashboard/layout/DashboardRoutePage';
import CoursesListPage from '@/features/courses/CoursesListPage';
import CourseWorkspacePage from '@/features/courses/CourseWorkspacePage';
import NotificationsPage from '@/features/notifications/NotificationsPage';
import { revisionsService } from '@/services/revisions';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/feedback';
import LeadsPage from '@/features/leads/LeadsPage';
import CustomerPage from '@/features/leads/CustomerPage';
import PaymentsPage from '@/features/payments/PaymentsPage';
import { leadsService } from '@/services/leads.mock';
import { Button } from '@/components/ui/Button';
import { useNewCourseDialog } from '@/features/courses/newCourseDialogStore';
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage'));
function SubmissionsPage() {
  const { t } = useTranslation('courses');
  const query = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => revisionsService.listMine(),
  });
  if (!query.data?.length)
    return <EmptyState title={t('submissionsEmpty')} description={t('submissionsDescription')} />;
  return (
    <section className="grid gap-3">
      <h1 className="text-2xl font-bold">{t('submissions')}</h1>
      {query.data.map((item) => (
        <Link
          key={item.id}
          to={`/assistant/courses/${item.courseId}`}
          className="rounded-sm border border-border bg-surface p-4"
        >
          <strong>{item.snapshot.details.title.en || item.snapshot.details.slug}</strong>
          <span className="ms-3 text-sm text-muted">{t(`revisionStatuses.${item.status}`)}</span>
          {item.rejectionReason && (
            <p className="mt-2 text-sm text-danger">{item.rejectionReason}</p>
          )}
        </Link>
      ))}
    </section>
  );
}
function WorkQueuePage() {
  const { t } = useTranslation('dashboard');
  const newCourse = useNewCourseDialog();
  const queue = useQuery({
    queryKey: ['assistant-work-queue'],
    queryFn: () => leadsService.queueCounts(),
  });
  const submissions = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => revisionsService.listMine(),
  });
  return (
    <main className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t('workQueue.title')}</h1>
        <Button onClick={newCourse.open}>{t('newCourse')}</Button>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: t('workQueue.newLeads'),
            count: queue.data?.newNeedsContact ?? 0,
            to: '/assistant/leads?followUp=new',
          },
          {
            label: t('workQueue.awaitingFollowUp'),
            count: queue.data?.assignedAwaiting ?? 0,
            to: '/assistant/leads?assigned=me&followUp=awaiting_payment',
          },
          {
            label: t('workQueue.submissions'),
            count: submissions.data?.length ?? 0,
            to: '/assistant/submissions',
          },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="grid min-h-32 content-center gap-2 rounded-sm border border-border bg-surface p-5"
          >
            <span>{item.label}</span>
            <strong className="text-3xl">{item.count}</strong>
          </Link>
        ))}
      </div>
    </main>
  );
}
export default function AssistantPage() {
  const { pathname } = useLocation();
  if (pathname === '/assistant/courses') return <CoursesListPage assistant />;
  if (pathname === '/assistant/courses/new')
    return <Navigate to="/assistant/courses?new=1" replace />;
  if (/^\/assistant\/courses\/[^/]+/.test(pathname)) return <CourseWorkspacePage assistant />;
  if (pathname === '/assistant/submissions') return <SubmissionsPage />;
  if (pathname === '/assistant/notifications') return <NotificationsPage assistant />;
  if (pathname === '/assistant/leads') return <LeadsPage />;
  if (/^\/assistant\/leads\/[^/]+/.test(pathname)) return <CustomerPage />;
  if (pathname === '/assistant/payments') return <PaymentsPage />;
  if (pathname === '/assistant/analytics')
    return (
      <Suspense
        fallback={<div role="status" className="min-h-64 animate-pulse rounded-sm bg-border/50" />}
      >
        <AnalyticsPage />
      </Suspense>
    );
  if (pathname === '/assistant') return <WorkQueuePage />;
  return <DashboardRoutePage area="assistant" />;
}
