import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker, type DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { ar, enGB } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import 'react-day-picker/style.css';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/i18n/useLanguage';
import { academyDateKey } from '@/lib/timezone';

function parseDay(value?: string) {
  if (!value) return undefined;
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  label,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  label: string;
}) {
  const { t } = useTranslation('common');
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const selected: DateRange = { from: parseDay(from), to: parseDay(to) };
  const [draft, setDraft] = useState<DateRange>(selected);
  const locale = language === 'ar' ? ar : enGB;
  const today = parseDay(academyDateKey(new Date())) ?? new Date();
  const display = [selected.from, selected.to]
    .filter((value): value is Date => Boolean(value))
    .map((value) => format(value, 'd MMM yyyy', { locale }))
    .join(' – ');
  const select = (range: DateRange | undefined) => {
    if (!range?.from) return;
    setDraft(range);
    if (!range.to) return;
    const start = format(range.from, 'yyyy-MM-dd');
    const end = format(range.to, 'yyyy-MM-dd');
    if (start > end || end > academyDateKey(today)) return;
    onChange(start, end);
    if (range.to) setOpen(false);
  };
  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen: boolean) => {
        if (nextOpen) setDraft(selected);
        setOpen(nextOpen);
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${display}`}
          className="inline-flex min-h-11 min-w-48 items-center gap-2 rounded-xs border border-border bg-surface px-3 text-start text-sm"
        >
          <CalendarDays aria-hidden="true" size={16} />
          <span>{display || t('selectDateRange')}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          className="z-[60] max-w-[calc(100vw-1rem)] rounded-sm border border-border bg-surface p-3 text-ink shadow-elevated"
        >
          <DayPicker
            mode="range"
            selected={draft}
            onSelect={select}
            disabled={{ after: today }}
            weekStartsOn={6}
            locale={locale}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            showOutsideDays
            fixedWeeks
          />
          <div className="flex justify-end border-t border-border pt-2">
            <button
              type="button"
              className="min-h-10 px-3 text-sm text-muted underline"
              onClick={() => setOpen(false)}
            >
              {t('close')}
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
