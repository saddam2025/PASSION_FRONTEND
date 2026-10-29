import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';

export interface TableRow {
  cells: readonly ReactNode[];
}
export function ChartCard({
  title,
  subtitle,
  definition,
  loading,
  error,
  onRetry,
  empty,
  children,
  tableHeaders,
  tableRows,
  ariaLabel,
}: {
  title: string;
  subtitle?: string;
  definition: string;
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  empty: boolean;
  children: ReactNode;
  tableHeaders: readonly string[];
  tableRows: readonly TableRow[];
  ariaLabel: string;
}) {
  const { t } = useTranslation('analytics');
  const [table, setTable] = useState(false);
  return (
    <section
      aria-label={ariaLabel}
      className="grid gap-3 rounded-md border border-border bg-surface p-4 shadow-soft sm:p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          <p className="mt-1 text-xs text-muted">{definition}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setTable((value) => !value)}
          aria-pressed={table}
        >
          {table ? t('chartView') : t('tableView')}
        </Button>
      </header>
      {loading ? (
        <Skeleton variant="card" className="min-h-56" />
      ) : error ? (
        <ErrorState title={t('sectionError')} onRetry={onRetry} />
      ) : empty ? (
        <EmptyState title={t('sectionEmpty')} />
      ) : table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr>
                {tableHeaders.map((header) => (
                  <th key={header} className="p-2 text-start">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr key={index} className="border-t border-border">
                  {row.cells.map((cell, cellIndex) => (
                    <td key={cellIndex} className="p-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="min-h-56">{children}</div>
      )}
    </section>
  );
}
