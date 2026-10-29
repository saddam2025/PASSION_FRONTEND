import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { auditService } from '@/services/audit.mock';
import { toCsv } from '@/lib/csv';
import { DateRangePicker } from '@/components/common/DateRangePicker';
export default function AuditPage() {
  const { t } = useTranslation('audit');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const query = useQuery({
    queryKey: ['audit', search, page, dateRange],
    queryFn: () => auditService.list({ search, page, ...dateRange }),
  });
  const exportLog = async () => {
    const events = await auditService.export();
    const text = toCsv(
      ['at', 'actor', 'action', 'entityId', 'note'],
      events.map((x) => [x.at, x.actorId, x.action, x.entityId, x.note]),
    );
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  if (query.isLoading) return <Skeleton variant="card" />;
  if (query.isError)
    return <ErrorState title={t('loadError')} onRetry={() => void query.refetch()} />;
  return (
    <main className="grid gap-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <button className="min-h-11 rounded-xs border px-4" onClick={() => void exportLog()}>
          {t('export')}
        </button>
      </header>
      <input
        className="min-h-11 rounded-xs border px-3"
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        placeholder={t('search')}
        aria-label={t('search')}
      />
      <DateRangePicker
        from={dateRange.from}
        to={dateRange.to}
        label={t('dateRange')}
        onChange={(from, to) => {
          setPage(1);
          setDateRange({ from, to });
        }}
      />
      {!query.data?.items.length ? (
        <EmptyState title={t('empty')} />
      ) : (
        <section className="grid gap-2">
          {query.data.items.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelected(selected === event.id ? null : event.id)}
              className="grid gap-1 rounded-sm border border-border bg-surface p-4 text-start"
            >
              <span>
                {t(`actions.${event.action.replaceAll('.', '_')}`)} ·{' '}
                <span dir="ltr">{event.at}</span>
              </span>
              <span className="text-sm text-muted">
                {event.actorId} · {event.entityId}
              </span>
              {selected === event.id && (
                <pre className="overflow-auto whitespace-pre-wrap text-xs">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              )}
            </button>
          ))}
        </section>
      )}
      <p>{t('total', { count: query.data?.total ?? 0 })}</p>
    </main>
  );
}
