import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  formatAnalyticsMoney,
  formatAnalyticsNumber,
  formatAnalyticsPercent,
} from '@/lib/analytics/format';
import type { AnalyticsResult } from '@/lib/analytics';
import type { AppLanguage } from '@/i18n';

export function AnalyticsTables({
  data,
  currency,
  language,
}: {
  data: AnalyticsResult;
  currency: string;
  language: AppLanguage;
}) {
  const { t } = useTranslation('analytics');
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'registrations',
    direction: 'desc',
  });
  const columns = [
    'course',
    'registrations',
    'uniqueCustomers',
    'paidEnrollments',
    'partiallyPaid',
    'unpaid',
    'conversion',
    'netRevenue',
    'outstanding',
  ] as const;
  const sortedRows = [...data.coursePerformance].sort((a, b) => {
    const values: Record<(typeof columns)[number], number> = {
      course: a.title[language].localeCompare(b.title[language], language),
      registrations: a.registrations - b.registrations,
      uniqueCustomers: a.uniqueCustomers - b.uniqueCustomers,
      paidEnrollments: a.paid - b.paid,
      partiallyPaid: a.partial - b.partial,
      unpaid: a.unpaid - b.unpaid,
      conversion: (a.conversion ?? -1) - (b.conversion ?? -1),
      netRevenue: (a.netRevenue[currency] ?? 0) - (b.netRevenue[currency] ?? 0),
      outstanding: (a.outstanding[currency] ?? 0) - (b.outstanding[currency] ?? 0),
    };
    return (sort.direction === 'asc' ? 1 : -1) * values[sort.key as (typeof columns)[number]];
  });
  const total = {
    registrations: data.kpis.enrollments,
    customers: data.kpis.uniqueCustomers,
    paid: data.kpis.paidEnrollments,
    partial: data.kpis.partiallyPaid,
    unpaid: data.kpis.unpaid,
    net: data.kpis.netRevenue[currency] ?? 0,
    outstanding: data.kpis.outstanding[currency] ?? 0,
    conversion: data.kpis.conversion,
  };
  return (
    <div className="grid gap-5">
      <section className="grid gap-3 rounded-md border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-bold">{t('coursePerformance')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[55rem] text-start text-sm">
            <thead>
              <tr>
                {columns.map((key) => (
                  <th
                    key={key}
                    className="p-2 text-start"
                    aria-sort={
                      sort.key === key
                        ? sort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      className="min-h-11 text-start underline-offset-4 hover:underline focus-visible:underline"
                      onClick={() =>
                        setSort((current) => ({
                          key,
                          direction:
                            current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
                        }))
                      }
                    >
                      {t(key)}
                      {sort.key === key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.courseId} className="border-t border-border">
                  <td className="p-2">
                    <Link
                      className="underline"
                      to={`/admin/leads?course=${encodeURIComponent(row.courseId)}&from=${data.query.from}&to=${data.query.to}`}
                    >
                      {row.title[language]}
                    </Link>
                  </td>
                  <td className="p-2">{formatAnalyticsNumber(row.registrations, language)}</td>
                  <td className="p-2">{formatAnalyticsNumber(row.uniqueCustomers, language)}</td>
                  <td className="p-2">{formatAnalyticsNumber(row.paid, language)}</td>
                  <td className="p-2">{formatAnalyticsNumber(row.partial, language)}</td>
                  <td className="p-2">{formatAnalyticsNumber(row.unpaid, language)}</td>
                  <td className="p-2">
                    {row.conversion === null
                      ? '—'
                      : formatAnalyticsPercent(row.conversion, language)}
                  </td>
                  <td className="p-2">
                    {formatAnalyticsMoney(row.netRevenue[currency] ?? 0, currency, language)}
                  </td>
                  <td className="p-2">
                    {formatAnalyticsMoney(row.outstanding[currency] ?? 0, currency, language)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-bold">
                <td className="p-2">{t('total')}</td>
                <td>{total.registrations}</td>
                <td>{total.customers}</td>
                <td>{total.paid}</td>
                <td>{total.partial}</td>
                <td>{total.unpaid}</td>
                <td>
                  {total.conversion === null
                    ? '—'
                    : formatAnalyticsPercent(total.conversion, language)}
                </td>
                <td>{formatAnalyticsMoney(total.net, currency, language)}</td>
                <td>{formatAnalyticsMoney(total.outstanding, currency, language)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
      <section className="grid gap-3 rounded-md border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-bold">{t('sources')}</h2>
        {!data.hasAttribution ? (
          <p className="text-sm text-muted">{t('noAttribution')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-start">{t('source')}</th>
                  <th className="p-2 text-start">{t('registrations')}</th>
                  <th className="p-2 text-start">{t('paidEnrollments')}</th>
                  <th className="p-2 text-start">{t('conversion')}</th>
                  <th className="p-2 text-start">{t('distribution')}</th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((row) => (
                  <tr key={row.source} className="border-t border-border">
                    <td className="p-2">{t(`sourceNames.${row.source}`)}</td>
                    <td className="p-2">{formatAnalyticsNumber(row.registrations, language)}</td>
                    <td className="p-2">{formatAnalyticsNumber(row.paid, language)}</td>
                    <td className="p-2">
                      {row.conversion === null
                        ? '—'
                        : formatAnalyticsPercent(row.conversion, language)}
                    </td>
                    <td className="p-2">
                      <div
                        className="h-3 rounded-full bg-[var(--chart-1)]"
                        style={{
                          width: `${data.kpis.enrollments ? (row.registrations / data.kpis.enrollments) * 100 : 0}%`,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
