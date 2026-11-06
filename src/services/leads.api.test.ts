import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetApiSessionForTests } from '@/api/client';
import { apiLeadsService } from './leads.api';

const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

describe('dual-currency enrollment list adapter', () => {
  beforeEach(() => resetApiSessionForTests());
  afterEach(() => { vi.unstubAllGlobals(); resetApiSessionForTests(); });

  it('sends the audience filter and preserves the audience and currency snapshot from the API', async () => {
    let requested = '';
    vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => {
      requested = String(url);
      return json({ items: [{ id: 'enrollment-1', reference: 'PAS-123456', lead: { fullName: 'مها علي' }, courseTitle: { ar: 'كورس' }, priceSnapshot: { amount: 12500, currency: 'USD' }, audience: 'foreign', enrollmentStatus: 'pending', followUpStatus: 'new', registeredAt: '2026-11-06T10:00:00.000Z' }], total: 1, page: 1, pageSize: 25 });
    }));
    const result = await apiLeadsService.list({ audience: 'foreign', actorRole: 'assistant' });
    expect(requested).toContain('/enrollments?');
    expect(new URL(requested, 'http://localhost').searchParams.get('audience')).toBe('foreign');
    expect(result.items[0]).toMatchObject({ audience: 'foreign', priceSnapshot: { amount: 12500, currency: 'USD' } });
  });

  it('treats legacy rows without audience as Egyptian while preserving their price currency', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ items: [{ id: 'enrollment-2', reference: 'PAS-654321', lead: { fullName: 'مها علي' }, courseTitle: 'كورس', priceSnapshot: { amount: 200000, currency: 'EGP' }, enrollmentStatus: 'pending', followUpStatus: 'new', registeredAt: '2026-11-06T10:00:00.000Z' }], total: 1, page: 1, pageSize: 25 })));
    const result = await apiLeadsService.list({ actorRole: 'assistant' });
    expect(result.items[0]).toMatchObject({ audience: 'egyptian', priceSnapshot: { amount: 200000, currency: 'EGP' } });
  });

  it('preserves a foreign audience and USD price/payment snapshots in registration detail', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => {
      const path = String(url);
      if (path.includes('/payments')) return json({
        items: [{ id: 'payment-1', enrollmentId: 'enrollment-3', kind: 'payment', amount: 12550, currency: 'USD', method: 'cash', receivedAt: '2026-11-06T10:00:00.000Z', status: 'confirmed', recordedBy: 'staff-1', createdAt: '2026-11-06T10:00:00.000Z' }],
        total: 1, paymentSummary: { netMinor: 12550, status: 'paid', outstandingMinor: 0 }, outstandingMinor: 0,
      });
      return json({ enrollment: {
        id: 'enrollment-3', reference: 'PAS-333333', lead: { id: 'lead-3', fullName: 'مها علي', email: 'maha@example.test', phone: '+201000000000' },
        courseSnapshot: { title: { ar: 'كورس بالدولار' }, slug: 'usd-course' },
        priceSnapshot: { amount: 12550, currency: 'USD' }, audience: 'foreign',
        formSnapshot: { fields: [] }, answers: {}, enrollmentStatus: 'confirmed', followUpStatus: 'contacted', registeredAt: '2026-11-06T10:00:00.000Z', history: [],
      } });
    }));

    const result = await apiLeadsService.getCustomer('enrollment-3', 'assistant');
    expect(result.enrollments[0]).toMatchObject({ audience: 'foreign', priceSnapshot: { amount: 12550, currency: 'USD' } });
    expect(result.payments[0]).toMatchObject({ amount: 12550, currency: 'USD' });
  });
});
