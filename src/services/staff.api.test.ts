import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetApiSessionForTests } from '@/api/client';
import { apiLeadsService } from './leads.api';
import { apiPaymentsService } from './payments.api';
import { apiPrivateMediaService } from './privateMedia';
import { canVoidPaymentRecord } from './paymentAccess';

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const paymentRow = { id: 'payment-1', enrollmentId: 'enroll-1', kind: 'payment' as const, amount: 1250, currency: 'EGP', method: 'cash' as const, receivedAt: '2026-11-03T10:00:00.000Z', status: 'confirmed' as const, recordedBy: 'assistant-1', createdAt: '2026-11-03T10:00:00.000Z', idempotencyKey: 'retry-key-001' };

describe('INT-3 staff API adapters', () => {
  beforeEach(() => resetApiSessionForTests());
  afterEach(() => { vi.unstubAllGlobals(); resetApiSessionForTests(); });

  it('builds enrollment filters with Cairo calendar-day query names and paged results', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => { void input; return json({ items: [{ id: 'enroll-1', reference: 'PAS-234567', lead: { fullName: 'مريم', email: 'm@example.test', phone: '+20100' }, courseTitle: { ar: 'كورس' }, priceSnapshot: { amount: 12000, currency: 'EGP' }, enrollmentStatus: 'pending', followUpStatus: 'new', paymentSummary: { status: 'unpaid', netMinor: 0 }, assignedTo: null, registeredAt: '2026-11-03T10:00:00.000Z' }], total: 26, page: 2, pageSize: 25 }); });
    vi.stubGlobal('fetch', fetchMock);
    const page = await apiLeadsService.list({ search: 'مريم', courseId: '64f000000000000000000001', enrollmentStatus: 'pending', followUpStatus: 'new', paymentStatus: 'unpaid', assigned: 'me', dateFrom: '2026-11-01', dateTo: '2026-11-03', sort: 'oldest', page: 2, pageSize: 25, actorRole: 'assistant' });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('dateFrom=2026-11-01'); expect(url).toContain('dateTo=2026-11-03');
    expect(url).toContain('followUpStatus=new'); expect(url).toContain('assignedTo=me'); expect(url).toContain('courseId=64f000000000000000000001'); expect(url).toContain('search=%D9%85%D8%B1%D9%8A%D9%85'); expect(url).toContain('page=2');
    expect(page).toMatchObject({ page: 2, pageSize: 25, pageCount: 2, items: [{ paymentSummary: { status: 'unpaid', netMinor: 0 } }] });
  });

  it('reuses the same payment idempotency key and sends the receipt key and minor-unit body on retry', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input); calls.push({ url, init });
      if (url.endsWith('/auth/csrf')) return json({ csrfToken: 'csrf' });
      return json({ payment: paymentRow, paymentSummary: { status: 'partially_paid', netMinor: 1250, outstandingMinor: 10750 }, replayed: true }, 200);
    });
    vi.stubGlobal('fetch', fetchMock);
    const input = { enrollmentId: 'enroll-1', kind: 'payment' as const, amount: 1250, currency: 'EGP', method: 'cash' as const, receivedAt: '2026-11-03T10:00:00.000Z', idempotencyKey: 'retry-key-001', receiptMediaKey: 'receipts/2026/11/0123456789012345678901234567890123456789.webp' };
    await apiPaymentsService.record(input); await apiPaymentsService.record(input);
    const posts = calls.filter((call) => call.url.endsWith('/enrollments/enroll-1/payments'));
    expect(posts).toHaveLength(2);
    for (const call of posts) expect(JSON.parse(String(call.init?.body))).toMatchObject({ amount: 1250, idempotencyKey: 'retry-key-001', receiptMediaKey: input.receiptMediaKey, receivedAt: input.receivedAt });
  });

  it('uploads a private receipt and forwards its returned relative key to the payment request', async () => {
    class FakeXhr {
      upload = {};
      status = 201;
      responseText = JSON.stringify({ id: 'receipt-1', key: 'receipts/2026/11/0123456789012345678901234567890123456789.pdf' });
      timeout = 0; withCredentials = false;
      onload?: () => void; onerror?: () => void; ontimeout?: () => void;
      open() {} setRequestHeader() {} send() { queueMicrotask(() => this.onload?.()); }
    }
    const posted: Array<{ url: string; body?: string }> = [];
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input); posted.push({ url, body: init?.body as string | undefined });
      return url.endsWith('/auth/csrf') ? json({ csrfToken: 'csrf' }) : json({ payment: paymentRow, paymentSummary: {}, replayed: false }, 201);
    }));
    const receipt = await apiPrivateMediaService.upload(new File(['%PDF'], 'receipt.pdf', { type: 'application/pdf' }));
    expect(receipt.receiptMediaKey).toBe('receipts/2026/11/0123456789012345678901234567890123456789.pdf');
    await apiPaymentsService.record({ enrollmentId: 'enroll-1', kind: 'payment', amount: 100, currency: 'EGP', method: 'cash', receivedAt: paymentRow.receivedAt, idempotencyKey: 'receipt-key-001', receiptMediaKey: receipt.receiptMediaKey! });
    const request = posted.find((item) => item.url.endsWith('/enrollments/enroll-1/payments'));
    expect(JSON.parse(request?.body ?? '{}').receiptMediaKey).toBe(receipt.receiptMediaKey);
  });

  it('voids only the current Assistant payment record and leaves foreign rows untouched', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/csrf')) return json({ csrfToken: 'csrf' });
      if (url.endsWith('/enrollments/enroll-1/payments')) return json({ items: [{ ...paymentRow, id: 'foreign', recordedBy: 'other' }, { ...paymentRow, id: 'own', recordedBy: 'assistant-1' }] });
      return json({ payment: { ...paymentRow, id: 'own', status: 'voided' }, paymentSummary: {} });
    });
    vi.stubGlobal('fetch', fetchMock);
    await apiPaymentsService.markUnpaid('enroll-1', 'تم إدخال المبلغ بالخطأ', 'assistant-1', 'assistant');
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain('/payments/own/void');
    await expect(apiPaymentsService.markUnpaid('enroll-1', 'سبب واضح', 'someone-else', 'assistant')).rejects.toMatchObject({ status: 403, message: 'مش مسموح لك تعمل الإجراء ده.' });
  });

  it('offers void only for the current Assistant own confirmed payment, while Admin may void any payment', () => {
    expect(canVoidPaymentRecord(paymentRow, { id: 'assistant-1', role: 'assistant' })).toBe(true);
    expect(canVoidPaymentRecord({ ...paymentRow, recordedBy: 'someone-else' }, { id: 'assistant-1', role: 'assistant' })).toBe(false);
    expect(canVoidPaymentRecord({ ...paymentRow, kind: 'refund' }, { id: 'assistant-1', role: 'assistant' })).toBe(false);
    expect(canVoidPaymentRecord({ ...paymentRow, recordedBy: 'someone-else' }, { id: 'admin-1', role: 'admin' })).toBe(true);
  });

  it('fetches a fresh signed receipt URL on every view and does not cache it', async () => {
    let requests = 0;
    vi.stubGlobal('fetch', vi.fn(async () => { requests += 1; return json({ url: `https://signed.invalid/${requests}`, expiresIn: 60 }); }));
    expect((await apiPrivateMediaService.getSignedUrl('receipt-id')).url).toContain('/1');
    expect((await apiPrivateMediaService.getSignedUrl('receipt-id')).url).toContain('/2');
    expect(requests).toBe(2);
  });

  it('downloads filtered CSV with credentials, parses filename, and surfaces the row-cap 422', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => String(input).endsWith('/auth/csrf') ? json({ csrfToken: 'csrf' }) : new Response('csv-data', { status: 200, headers: { 'Content-Disposition': 'attachment; filename="registrations.csv"' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await apiLeadsService.exportCsv({ search: 'customer@example.test', dateFrom: '2026-11-01', dateTo: '2026-11-03', followUpStatus: 'new' });
    expect(result.filename).toBe('registrations.csv'); expect(await result.blob.text()).toBe('csv-data');
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toContain('dateFrom=2026-11-01');
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).not.toContain('customer@example.test');
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).endsWith('/auth/csrf') ? json({ csrfToken: 'csrf' }) : json({ error: { code: 'VALIDATION_ERROR', details: [{ field: 'maxRows', maxRows: 10000 }] } }, 422)));
    await expect(apiLeadsService.exportCsv()).rejects.toMatchObject({ status: 422, message: 'عدد السجلات أكبر من حد التصدير. قلّل الفترة أو استخدم فلاتر إضافية.' });
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).endsWith('/auth/csrf') ? json({ csrfToken: 'csrf' }) : json({ error: { code: 'FORBIDDEN' } }, 403)));
    await expect(apiLeadsService.exportCsv()).rejects.toMatchObject({ status: 403, message: 'مش مسموح لك تعمل الإجراء ده.' });
  });

  it('maps enrollment detail answers by the saved Arabic form labels and returns reference-only history', async () => {
    const detail = { enrollment: { id: 'enroll-1', reference: 'PAS-234567', lead: { id: 'lead-1', fullName: 'مريم', email: 'm@example.test', phone: '+20100', phoneNormalized: '20100' }, courseSnapshot: { title: { ar: 'كورس' }, slug: 'course' }, priceSnapshot: { amount: 5000, currency: 'EGP' }, formSnapshot: { fields: [{ id: 'field-a', label: { ar: 'اسم الشركة' }, type: 'text' }] }, answers: { 'field-a': 'أكاديمية' }, enrollmentStatus: 'pending', followUpStatus: 'new', registeredAt: '2026-11-03T10:00:00.000Z', history: [], notes: [], otherEnrollments: [{ reference: 'PAS-234568' }], possibleDuplicateOf: { hasPossibleDuplicate: true, references: [{ reference: 'PAS-234569' }] } } };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => String(input).endsWith('/payments') ? json({ items: [], total: 0, paymentSummary: { status: 'unpaid', netMinor: 0 }, outstandingMinor: 5000 }) : json(detail));
    vi.stubGlobal('fetch', fetchMock);
    const result = await apiLeadsService.getCustomer('enroll-1', 'assistant');
    expect(result.enrollments[0]?.formSnapshot.fields[0]).toMatchObject({ id: 'field-a', label: { ar: 'اسم الشركة' } });
    expect(result.enrollments[0]?.answers['field-a']).toBe('أكاديمية');
    expect(result.otherEnrollments).toEqual([{ reference: 'PAS-234568' }]);
    expect(result.possibleDuplicate?.hasPossibleDuplicate).toBe(true);
  });

  it.each([
    [403, 'FORBIDDEN', 'مش مسموح لك تعمل الإجراء ده.'],
    [409, 'CONFLICT', 'فيه تعارض في البيانات. راجع القيم الحالية وحاول تاني.'],
    [422, 'VALIDATION_ERROR', 'راجع البيانات اللي دخلتها وحاول تاني.'],
  ])('maps HTTP %s staff errors to Arabic UI copy', async (status, code, message) => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => String(input).endsWith('/auth/csrf') ? json({ csrfToken: 'csrf' }) : json({ error: { code } }, status)));
    await expect(apiLeadsService.updateFollowUp('enroll-1', 'contacted')).rejects.toMatchObject({ status, message });
  });
});
