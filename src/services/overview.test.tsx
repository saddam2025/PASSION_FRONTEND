import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { overviewQuery, overviewService } from './overview';
import { OverviewPageContent } from '@/features/dashboard/OverviewPage';

const fixture = vi.hoisted(() => ({ data: {
  period: '30d' as const, totalRegistrations: 0, registrations: 0, paid: 0, unpaid: 0,
  netRevenue: 0, courses: [] as Array<{ id: string; title: string; registrations: number; paid: number; revenue: number; currency: string }>,
} }));
vi.mock('@tanstack/react-query', () => ({ useQuery: () => ({ isPending: false, isError: false, data: fixture.data }) }));
vi.mock('react-i18next', async (importOriginal) => ({
  ...await importOriginal(),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } });
afterEach(() => vi.unstubAllGlobals());

describe('Admin overview integration', () => {
  it('builds inclusive Cairo dates for presets and omits dates for all time', () => {
    const now = new Date('2026-11-03T12:00:00+02:00');
    expect(overviewQuery({ period: '7d' }, now).toString()).toBe('from=2026-10-28&to=2026-11-03');
    expect(overviewQuery({ period: '30d' }, now).toString()).toBe('from=2026-10-05&to=2026-11-03');
    expect(overviewQuery({ period: 'range', from: '2026-10-10', to: '2026-10-12' }, now).toString()).toBe('from=2026-10-10&to=2026-10-12');
    expect(overviewQuery({ period: 'all' }, now).toString()).toBe('');
  });

  it('requests the overview endpoint and converts all money fields from minor units', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => { void input; return json({ totalRegistrations: 8, registrations: 3, paid: 2, unpaid: 1, netRevenue: 12345, courses: [{ id: 'c1', title: { ar: 'كورس' }, registrations: 3, paid: 2, revenue: 10000, currency: 'EGP' }] }); });
    vi.stubGlobal('fetch', fetchMock);
    await expect(overviewService.get({ period: 'range', from: '2026-11-01', to: '2026-11-03' })).resolves.toMatchObject({
      totalRegistrations: 8, registrations: 3, paid: 2, unpaid: 1, netRevenue: 123.45,
      courses: [{ title: 'كورس', revenue: 100 }],
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/admin/overview?from=2026-11-01&to=2026-11-03');
  });

  it('renders zero cards and the empty-course message for an empty API response', () => {
    fixture.data = { period: '30d', totalRegistrations: 0, registrations: 0, paid: 0, unpaid: 0, netRevenue: 0, courses: [] };
    const markup = renderToStaticMarkup(<OverviewPageContent data={fixture.data} />);
    expect(markup).toContain('مفيش تسجيلات في الفترة دي.');
    expect(markup.match(/>0</g)?.length).toBeGreaterThanOrEqual(4);
  });
});
