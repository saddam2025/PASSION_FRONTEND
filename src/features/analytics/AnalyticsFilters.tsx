import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { academyDateKey, addCalendarDays } from '@/lib/timezone';
import { currentMonthStart, defaultAnalyticsRange } from '@/lib/analytics/range';
import type { AnalyticsResult } from '@/lib/analytics';
import type { AppLanguage } from '@/i18n';
import { DateRangePicker } from '@/components/common/DateRangePicker';

export function AnalyticsFilters({
  data,
  language,
}: {
  data?: AnalyticsResult;
  language: AppLanguage;
}) {
  const { t } = useTranslation('analytics');
  const [params, setParams] = useSearchParams();
  const defaults = defaultAnalyticsRange();
  const from = params.get('from') ?? defaults.from;
  const to = params.get('to') ?? defaults.to;
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };
  const setPreset = (preset: string) => {
    const today = academyDateKey(new Date());
    let start = today,
      end = today;
    if (preset === 'last7' || preset === 'last30' || preset === 'last90')
      start = addCalendarDays(today, -(Number(preset.slice(4)) - 1));
    if (preset === 'thisMonth') start = currentMonthStart(today);
    if (preset === 'lastMonth') {
      const thisMonth = currentMonthStart(today);
      end = addCalendarDays(thisMonth, -1);
      start = currentMonthStart(end);
    }
    if (preset === 'thisYear') start = `${today.slice(0, 4)}-01-01`;
    if (preset === 'custom') return;
    const next = new URLSearchParams(params);
    next.set('from', start);
    next.set('to', end);
    next.delete('bucket');
    setParams(next);
  };
  const selected = (params.get('course') ?? '').split(',').filter(Boolean);
  const reset = () => setParams(new URLSearchParams({ from: defaults.from, to: defaults.to }));
  return (
    <section
      aria-label={t('filters')}
      className="flex flex-wrap items-end gap-2 rounded-sm border border-border bg-surface p-3 shadow-soft"
    >
      <label className="grid gap-1 text-sm">
        {t('datePreset')}
        <select
          className="min-h-11 rounded-xs border border-border px-3"
          value="custom"
          onChange={(event) => setPreset(event.target.value)}
          aria-label={t('datePreset')}
        >
          <option value="custom">{t('custom')}</option>
          {(
            ['today', 'last7', 'last30', 'last90', 'thisMonth', 'lastMonth', 'thisYear'] as const
          ).map((key) => (
            <option key={key} value={key}>
              {t(`presets.${key}`)}
            </option>
          ))}
        </select>
      </label>
      <DateRangePicker
        from={from}
        to={to}
        label={t('dateRange')}
        onChange={(start, end) => {
          const next = new URLSearchParams(params);
          next.set('from', start);
          next.set('to', end);
          setParams(next);
        }}
      />
      <details className="grid gap-1 rounded-xs border border-border px-3 py-2 text-sm">
        <summary className="min-h-7 cursor-pointer pt-1">
          {selected.length ? t('selectedCourses', { count: selected.length }) : t('allCourses')}
        </summary>
        <fieldset className="grid max-h-36 gap-2 overflow-y-auto border-t border-border pt-2">
          <legend className="sr-only">{t('courses')}</legend>
          <label className="flex min-h-9 items-center gap-2">
            <input
              type="checkbox"
              checked={!selected.length}
              onChange={() => update('course', '')}
            />
            {t('allCourses')}
          </label>
          {(data?.courseOptions ?? []).map((course) => (
            <label key={course.id} className="flex min-h-9 items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(course.id)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selected, course.id]
                    : selected.filter((id) => id !== course.id);
                  update('course', next.join(','));
                }}
              />
              {course.title[language]}
            </label>
          ))}
        </fieldset>
      </details>
      {(data?.currencies.length ?? 0) > 1 && (
        <label className="grid gap-1 text-sm">
          {t('currency')}
          <select
            className="min-h-11 rounded-xs border border-border px-3"
            value={params.get('currency') ?? data?.defaultCurrency ?? 'EGP'}
            onChange={(event) => update('currency', event.target.value)}
          >
            {data?.currencies.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </label>
      )}
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={params.get('compare') === '1'}
          onChange={(event) => update('compare', event.target.checked ? '1' : '')}
        />
        {t('compare')}
      </label>
      <label className="grid gap-1 text-sm">
        {t('bucket')}
        <select
          className="min-h-11 rounded-xs border border-border px-3"
          value={params.get('bucket') ?? ''}
          onChange={(event) => update('bucket', event.target.value)}
        >
          <option value="">{t('automatic')}</option>
          {(['day', 'week', 'month'] as const).map((key) => (
            <option key={key} value={key}>
              {t(`buckets.${key}`)}
            </option>
          ))}
        </select>
      </label>
      <Button variant="secondary" className="self-end" onClick={reset}>
        {t('reset')}
      </Button>
    </section>
  );
}
