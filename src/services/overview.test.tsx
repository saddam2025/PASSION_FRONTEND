// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { mapOverviewResponse, overviewQuery, overviewService } from './overview';
import { OverviewPageContent, default as OverviewPage } from '@/features/dashboard/OverviewPage';
import { buildFunnelStages } from '@/features/dashboard/OverviewCharts';
import { ChartErrorBoundary } from '@/features/dashboard/OverviewCharts';
import { clampFutureDate, last30Days, parseAppliedRange, presetRange, validateRange } from '@/features/dashboard/overviewRange';
import type { OverviewChartsData, OverviewData } from './overview';
import '@/i18n';

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const overviewResponse = { totalRegistrations: 8, registrations: 3, paid: 2, unpaid: 1, netRevenue: 12345, courses: [{ id: 'c1', title: { ar: 'كورس' }, registrations: 3, paid: 2, revenue: 10000, currency: 'EGP' }] };
const chartsResponse: OverviewChartsData = {
  range: { from: '2026-10-05', to: '2026-11-03', granularity: 'day' },
  registrationsSeries: [{ bucket: '2026-11-02', registrations: 4, paid: 2 }, { bucket: '2026-11-03', registrations: 0, paid: 0 }],
  revenueSeriesByCurrency: [{ currency: 'EGP', series: [{ bucket: '2026-11-03', netRevenue: 200000 }] }, { currency: 'USD', series: [{ bucket: '2026-11-03', netRevenue: 15000 }] }],
  netRevenueByCurrency: [{ currency: 'EGP', netRevenue: 200000 }, { currency: 'USD', netRevenue: 15000 }],
  funnel: { registered: 10, contacted: 8, awaitingPayment: 4, paid: 3, cancelled: 1 },
  paymentStatusDistribution: [{ status: 'paid', count: 3 }, { status: 'unpaid', count: 2 }],
  byCourse: [{ courseId: 'c1', title: 'كورس', registrations: 3, paid: 2 }, { courseId: null, title: 'أخرى', registrations: 1, paid: 0 }],
};
const overviewData = mapOverviewResponse(overviewResponse, '30d');
const moneyData: OverviewData = { ...overviewData, totalRegistrations: 0, registrations: 0, paid: 0, unpaid: 0, revenueByCurrency: [], courses: [] };
function renderPage(initialEntry = '/admin?from=2026-10-05&to=2026-11-03') {
  vi.stubGlobal('ResizeObserver', class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: { width: 600, height: 300 } } as ResizeObserverEntry], this as unknown as ResizeObserver); }
    unobserve() {}
    disconnect() {}
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes><Route path="/admin" element={<OverviewPage />} /></Routes></MemoryRouter></QueryClientProvider>);
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Admin overview range helpers', () => {
  const today = '2026-11-03';
  it('builds inclusive Cairo day ranges for all presets', () => {
    expect(last30Days(today)).toEqual({ from: '2026-10-05', to: today });
    expect(presetRange('7d', today)).toEqual({ from: '2026-10-28', to: today });
    expect(presetRange('30d', today)).toEqual({ from: '2026-10-05', to: today });
    expect(presetRange('90d', today)).toEqual({ from: '2026-08-06', to: today });
    expect(presetRange('month', today)).toEqual({ from: '2026-11-01', to: today });
    expect(presetRange('all', today)).toEqual({ all: true });
  });
  it('validates incomplete, reversed, oversized and future ranges safely', () => {
    expect(validateRange('', today, today)).toBe('incomplete');
    expect(validateRange('2026-11-04', today, today)).toBe('reversed');
    expect(validateRange('2025-09-01', today, today)).toBe('tooLong');
    expect(clampFutureDate('2026-11-05', today)).toEqual({ value: today, clamped: true });
    expect(clampFutureDate('bad', today)).toEqual({ value: '', clamped: false });
  });
  it('sanitizes malformed, partial, invalid and future URL ranges without throwing', () => {
    expect(parseAppliedRange('not-a-date', today, today).range).toEqual(last30Days(today));
    expect(parseAppliedRange(today, null, today).invalid).toBe(true);
    expect(parseAppliedRange('2026-11-04', '2026-11-05', today).invalid).toBe(true);
    expect(parseAppliedRange(null, null, today, true).range).toEqual({ all: true });
  });
  it('keeps the legacy API date serialization inclusive', () => {
    expect(overviewQuery({ period: '7d' }, new Date('2026-11-03T12:00:00+02:00')).toString()).toBe('from=2026-10-28&to=2026-11-03');
  });
});

describe('Admin overview services', () => {
  it('requests overview and charts separately using the same applied range and forwards cancellation', async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void init;
      return String(input).includes('/charts') ? json(chartsResponse) : json(overviewResponse);
    });
    vi.stubGlobal('fetch', fetchMock);
    await Promise.all([overviewService.get({ period: 'range', from: '2026-11-01', to: '2026-11-03' }, signal), overviewService.getCharts({ from: '2026-11-01', to: '2026-11-03' }, signal)]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual(expect.arrayContaining([expect.stringContaining('/admin/overview?from=2026-11-01&to=2026-11-03'), expect.stringContaining('/admin/overview/charts?from=2026-11-01&to=2026-11-03')]));
    expect(fetchMock.mock.calls.every(([, init]) => init?.signal === signal)).toBe(true);
  });
});

describe('Admin overview interactions', () => {
  it('editing both date fields triggers no request; Apply triggers one overview and one charts request', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => String(input).includes('/charts') ? json(chartsResponse) : json(overviewResponse));
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await screen.findByText('إجمالي التسجيلات');
    fetchMock.mockClear();
    const dates = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    fireEvent.change(dates[0], { target: { value: '2026-10-10' } });
    fireEvent.change(dates[1], { target: { value: '2026-10-20' } });
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'تطبيق' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('preset immediately fetches one pair and malformed URLs fall back with a notice', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => String(input).includes('/charts') ? json(chartsResponse) : json(overviewResponse));
    vi.stubGlobal('fetch', fetchMock);
    renderPage('/admin?from=garbage&to=2026-11-03');
    expect(await screen.findByText('الفترة اللي في الرابط مش صالحة، عرضنا آخر 30 يوم.')).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    fetchMock.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'آخر 7 أيام' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('disables Apply for invalid drafts and clamps typed future dates', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).includes('/charts') ? json(chartsResponse) : json(overviewResponse)));
    renderPage(); await screen.findByText('إجمالي التسجيلات');
    const apply = screen.getByRole('button', { name: 'تطبيق' }) as HTMLButtonElement;
    const dates = document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    fireEvent.change(dates[0], { target: { value: '2026-11-04' } });
    expect(apply.disabled).toBe(true);
    fireEvent.change(dates[1], { target: { value: '2026-12-01' } });
    expect(screen.getByText('التاريخ بعد النهارده، فظبطناه على تاريخ النهارده.')).toBeTruthy();
  });

  it.each([
    ['INVALID_RANGE', 'تاريخ البداية لازم يكون قبل تاريخ النهاية.'],
    ['RANGE_TOO_LARGE', 'الفترة لازم تكون 400 يوم أو أقل.'],
  ])('keeps %s range errors inside the overview page', async (code, message) => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).includes('/charts') ? json(chartsResponse) : json({ error: { code } }, 422)));
    renderPage();
    expect((await screen.findByRole('alert')).textContent).toContain(message);
    expect(screen.queryByText('المحتوى المطلوب مش موجود.')).toBeNull();
  });

  it('keeps previous summary values visible while the next range is loading', async () => {
    let delayNext = false;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const response = String(input).includes('/charts') ? json(chartsResponse) : json(overviewResponse);
      if (delayNext) return new Promise<Response>(() => undefined);
      return Promise.resolve(response);
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    expect(await screen.findByText('إجمالي التسجيلات')).toBeTruthy();
    expect(screen.getAllByText('8').length).toBeGreaterThan(0);
    delayNext = true;
    fireEvent.click(screen.getByRole('button', { name: 'آخر 7 أيام' }));
    expect((await screen.findByRole('status')).textContent).toContain('بنحدّث البيانات');
    expect(screen.getAllByText('8').length).toBeGreaterThan(0);
  });

  it('shows a charts error with retry while preserving overview numbers', async () => {
    let chartCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('/charts')) { chartCalls += 1; return chartCalls === 1 ? json({ error: { code: 'SERVICE_UNAVAILABLE' } }, 503) : json(chartsResponse); }
      return json(overviewResponse);
    });
    vi.stubGlobal('fetch', fetchMock);
    renderPage();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(await screen.findByText('8')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'حاول تاني' }));
    await waitFor(() => expect(chartCalls).toBe(2));
  });

  it('keeps currency revenues separate and shows Arabic status labels and accessible charts', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).includes('/charts') ? json(chartsResponse) : json(overviewResponse)));
    renderPage();
    expect(await screen.findByRole('region', { name: 'التسجيلات عبر الزمن' })).toBeTruthy();
    expect(await screen.findByText('بالجنيه المصري')).toBeTruthy();
    expect(screen.getByText('بالدولار')).toBeTruthy();
    expect(screen.getAllByText('غير مدفوع').length).toBeGreaterThan(1);
    expect(screen.getByRole('heading', { name: 'مسار التسجيل' })).toBeTruthy();
    const headings = [...document.querySelectorAll('h2')].map((heading) => heading.textContent);
    expect(headings.indexOf('التسجيلات عبر الزمن')).toBeLessThan(headings.lastIndexOf('التسجيلات حسب الكورس'));
    expect(document.querySelectorAll('table.sr-only').length).toBeGreaterThanOrEqual(6);
  });
});

describe('overview chart helpers and summary', () => {
  it('calculates funnel ratios with zero guards and no NaN values', () => {
    expect(buildFunnelStages({ registered: 10, contacted: 5, awaitingPayment: 0, paid: 0, cancelled: 2 }, ['سجّلوا', 'تواصل', 'انتظار', 'دفع']).map((stage) => [stage.percent, stage.drop])).toEqual([[100, 0], [50, 50], [0, 100], [0, 0]]);
    expect(buildFunnelStages({ registered: 0, contacted: 0, awaitingPayment: 0, paid: 0, cancelled: 0 }, ['أ', 'ب', 'ج', 'د']).every((stage) => !Object.values(stage).some((value) => typeof value === 'number' && Number.isNaN(value)))).toBe(true);
  });
  it('catches a throwing chart inside its own boundary and lets it retry', () => {
    const Boom = () => { throw new Error('chart failure'); };
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<ChartErrorBoundary title="تعذر الرسم" retryLabel="حاول تاني"><Boom /></ChartErrorBoundary>);
    expect(screen.getByRole('alert').textContent).toContain('تعذر الرسم');
    fireEvent.click(screen.getByRole('button', { name: 'حاول تاني' }));
    expect(screen.getByRole('alert')).toBeTruthy();
    error.mockRestore();
  });
  it('renders the empty course state and separate EGP/USD revenue summary', () => {
    const { container, rerender } = render(<OverviewPageContent data={moneyData} />);
    expect(container.textContent).toContain('مفيش بيانات في الفترة دي.');
    const multi = mapOverviewResponse({ ...overviewResponse, revenueByCurrency: [{ currency: 'EGP', netRevenue: 200000, paidCount: 1, unpaidCount: 1 }, { currency: 'USD', netRevenue: 15000, paidCount: 1, unpaidCount: 0 }], courses: [{ ...overviewResponse.courses[0]!, netByCurrency: { EGP: 200000, USD: 15000 } }] }, '30d');
    rerender(<OverviewPageContent data={multi} />);
    expect(container.textContent).toContain('2,000 ج.م');
    expect(container.textContent).toContain('150 $');
    expect(container.textContent).not.toContain('2,150');
  });
});
